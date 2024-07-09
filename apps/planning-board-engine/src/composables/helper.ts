import { addMinutes, addSeconds } from 'date-fns'
import { v4 } from 'uuid'
import type { QueueBasedAnyEvent, QueueBasedAnyEventRaw, QueueBasedStopEventRaw, UnscheduledTasks } from '../../types/planning-board'
import { knex } from '../knexConfig'

export function generateClientId() {
  return v4()
}
export function calculateDeviation(actualStartTime: string, plannedStartTime: string) {
  return new Date(actualStartTime).getTime() - new Date(plannedStartTime).getTime()
}
export async function compressJson(data: UnscheduledTasks[]) {
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
export function a(events: QueueBasedAnyEventRaw[], machines: number[], includeStops: boolean): QueueBasedAnyEvent[] {
  const modifiedEvents = setStopTimes(events).map((event) => {
    const isRunning = event.eventType !== 'stop' && (event.isStarted && !event.isStopped)
    const isFinished = event.eventType === 'finished' && (event.isStarted && event.isStopped)
    const isPlanned = event.eventType === 'planned'
    if (includeStops && event.eventType === 'stop') {
      return {
        ...event,
        isPlanned,
        isRunning: false,
        isFinished: false,
      } as QueueBasedAnyEvent
    }
    return {
      ...event,
      isPlanned,
      isRunning,
      isFinished,
    } as QueueBasedAnyEvent
  })

  const runningEvents = events.filter(ev => ev.eventType !== 'stop' && (ev.isStarted && !ev.isStopped))
  for (const event of runningEvents) {
    addSeconds(event.endTime, -30)
    addSeconds(event.endTime, -30)
  }
  return modifiedEvents
}
export function queueBasedEventStatus(events: QueueBasedAnyEventRaw[], includeStops: boolean): QueueBasedAnyEvent[] {
  if (includeStops) {
    const stops = events.filter(ev => ev.eventType === 'stop')
    const modifiedEvents = setStopTimes(events, stops)
    return modifiedEvents.map((event) => {
      const isRunning = event.eventType !== 'stop' && (event.isStarted && !event.isStopped)
      const isFinished = event.eventType === 'finished' && (event.isStarted && event.isStopped)
      const isPlanned = event.eventType === 'planned'

      if (event.eventType === 'stop') {
        return {
          ...event,
          isPlanned,
          isRunning: false,
          isFinished: false,
        } as QueueBasedAnyEvent
      }
      return {
        ...event,
        isPlanned,
        isRunning,
        isFinished,
      } as QueueBasedAnyEvent
    })
  }

  const runningEvents = events.filter(ev => ev.eventType !== 'stop' && (ev.isStarted && !ev.isStopped))
  for (const event of runningEvents) {
    addSeconds(event.endTime, -30)
    addSeconds(event.endTime, -30)
  }
  return events.map((event) => {
    const isRunning = event.eventType !== 'stop' && (event.isStarted && !event.isStopped)
    const isFinished = event.eventType === 'finished' && (event.isStarted && event.isStopped)
    const isPlanned = event.eventType === 'planned'

    return {
      ...event,
      isRunning,
      isFinished,
      isPlanned,
    } as QueueBasedAnyEvent
  })
}
export function setStopTimes(events: QueueBasedAnyEventRaw[], stops: QueueBasedAnyEventRaw[]): QueueBasedAnyEventRaw[] {
  const nonStopEvents = events.filter(ev => ev.eventType !== 'stop')
  const stopEvents: QueueBasedStopEventRaw[] = []

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

          let note = 'Auto-generated stop event'
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
