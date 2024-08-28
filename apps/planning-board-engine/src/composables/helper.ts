import { randomUUID } from 'node:crypto'
import { addSeconds } from 'date-fns'
import type { QueueBasedEvent, QueueBasedEventStop, QueueBasedEventWithStops, QueueBasedNonActualEvent, QueueBasedNonActualEventRaw } from '../../types/planning-board'
import { knex } from '../knexConfig'

export function generateClientId() {
  return randomUUID()
}
export function calculateDeviation(actualStartTime: string, plannedStartTime: string) {
  return new Date(actualStartTime).getTime() - new Date(plannedStartTime).getTime()
}
export async function compressJson(data: QueueBasedNonActualEventRaw[]) {
  const columns = Object.keys(data[0])
  const values = data.map(a => Object.values(a).map(e => e instanceof Date ? e.toISOString() : e))

  return { columns, values }
}
export async function hasNote(jobOrder: string): Promise<boolean> {
  const note = await knex({ p: 'dbo.PTBATCHNOTES' })
    .leftJoin({ b: 'dbo.BFUSERS' }, 'b.userID', 'p.USERID')
    .select({
      showOnScreen: 'p.SHOWONSCREEN',
    }).where('JOBORDER', '=', jobOrder)
  return note.some(i => i.showOnScreen === true)
}

export async function queueBasedEventStatus(events: QueueBasedEvent[], includeStops: boolean): Promise<QueueBasedEvent[]> {
  const ongoingEvents = events.filter(ev => ev.eventType === 'ongoing' || ev.eventType === 'manual')
  ongoingEvents.forEach((event) => {
    const plannedEventsOnSameMachine = events.filter(ev => ev.eventType === 'planned' && ev.machineId === event.machineId)
    plannedEventsOnSameMachine.forEach((ev) => {
      updatePlannedEvent(ev, event, events)
    })
  })
  const eventsWithPercentDone = events.map(ev => ({
    ...ev,
    percentDone: ev.deviation > 0 ? 100 - ((ev.deviation / ev.theoreticalDuration) * 100) : 100,
  }))
  if (includeStops) {
    const stops = events.filter(e => e.eventType === 'stop')
    return setStopTimes(eventsWithPercentDone, stops)
  }
  return eventsWithPercentDone
}

function updatePlannedEvent(ev: QueueBasedNonActualEvent, event: QueueBasedEvent, events: QueueBasedEvent[]) {
  if (ev.queueNumber === 1) {
    ev.startTime = addSeconds(event.endTime, 300).toString()
    ev.endTime = addSeconds(ev.startTime, ev.theoreticalDuration).toString()
  } else if (ev.queueNumber > 1) {
    const prevEvent = events.find(e => e.eventType === 'planned' && e.queueNumber === (ev.queueNumber - 1) && e.machineId === ev.machineId)
    if (prevEvent) {
      ev.startTime = addSeconds(prevEvent.endTime, 300).toString()
      ev.endTime = addSeconds(ev.startTime, ev.theoreticalDuration).toString()
    }
  }
}

export function setStopTimes(events: QueueBasedEvent[], stops: QueueBasedEventStop[]): QueueBasedEvent[] {
  const nonStopEvents = events.filter(ev => ev.eventType !== 'stop')
  const stopEvents: QueueBasedEventStop[] = []

  nonStopEvents.sort((a, b) => {
    if (a.machineId === b.machineId) {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    }
    return a.machineId - b.machineId
  })

  let stopCounter = 1

  for (let i = 0; i < nonStopEvents.length - 1; i++) {
    const currentEvent = nonStopEvents[i]
    const nextEvent = nonStopEvents[i + 1]

    if (currentEvent.machineId === nextEvent.machineId) {
      const currentEndTime = new Date(currentEvent.endTime)
      const nextStartTime = new Date(nextEvent.startTime)
      if ((nextStartTime.getTime() - currentEndTime.getTime()) > 300000) {
        if (currentEndTime < nextStartTime) {
          const inBetweenStops = stops.filter(s =>
            s.machineId === currentEvent.machineId
            && new Date(s.startTime) >= currentEndTime
            && new Date(s.endTime) <= nextStartTime,
          )

          let note = 'auto-generated'
          if (inBetweenStops.length > 0) {
            note = inBetweenStops.map(s => s.note).join(', ')
          }

          stopEvents.push({
            eventType: 'stop',
            machineId: currentEvent.machineId,
            stopNumber: `generated-${stopCounter}`,
            stopReason: `generated-${stopCounter}`,
            startTime: currentEvent.endTime,
            endTime: nextEvent.startTime,
            note,
          })
          stopCounter++
        }
      }
    }
  }

  return [...nonStopEvents, ...stopEvents]
}
