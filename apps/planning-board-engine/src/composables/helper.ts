import { v4 } from 'uuid'
import { addSeconds } from 'date-fns'
import type { QueueBasedEvent, QueueBasedEventWithStops, QueueBasedNonActualEventRaw } from '../../types/planning-board'
import { knex } from '../knexConfig'

export function generateClientId() {
  return v4()
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

export async function queueBasedEventStatus(events: QueueBasedEvent[]): Promise<void> {
  const ongoingEvents = events.filter(ev => ev.eventType === 'ongoing')
  for (const event of ongoingEvents) {
    if (new Date(event.endTime).getTime() < new Date().getTime()) {
      event.endTime = new Date().toString()
    }
    const test = events.filter(ev => ev.eventType === 'planned' && ev.machineId === event.machineId)
    for (const ev of test) {
      if (new Date(event.endTime).getTime() > new Date().getTime()) {
        if (ev.eventType === 'planned' && ev.queueNumber === 1) {
          ev.startTime = addSeconds(event.endTime, 300).toString()
          ev.endTime = addSeconds(ev.startTime, ev.theoreticalDuration).toString()
        }
      }
    }
  }
}
