import { addSeconds } from 'date-fns'
import { v4 } from 'uuid'
import type { UnscheduledTasks } from '../../types/planning-board'
import { knex } from '../knexConfig'

export function generateClientId() {
  return v4()
}
export function calculateDeviation(actualStartTime: string, plannedStartTime: string) {
  return new Date(actualStartTime).getTime() - new Date(plannedStartTime).getTime()
}

export function generateEventDates(events: any[]): Event[] {
  const updatedEvents: Event[] = []

  for (let i = 0; i < events.length; i++) {
    const event = events[i]

    let startDate: Date
    let endDate: Date

    if (event.queueNumber === 1 || i === 0 || event.machineId !== events[i - 1].machineId) {
      // NOTE: Acil test gerekli. Bir task başladığı zaman tam olarak neler olduğunu
      // bilmediğim için doğru yapamamış olma ihtimalim yüksek!
      // Özellikle task bittikten sonra hala daha planlanmış eventler içinde gözükebilir.
      // Buda archive durumunu karıştırır.
      if (event.isStarted) {
        startDate = event.startDate
        if (event.isFinished) {
          endDate = event.endDate
        } else {
          endDate = addSeconds(startDate, event.theoreticalDuration)
          if (endDate.getTime() < new Date().getTime()) {
            endDate = new Date()
          }
        }
      } else {
        startDate = new Date()
        endDate = addSeconds(startDate, event.theoreticalDuration)
      }
    } else {
      const previousEndDate = updatedEvents[updatedEvents.length - 1].endDate
      startDate = new Date(previousEndDate.getTime() + 5 * 60 * 1000)
      endDate = addSeconds(startDate, event.theoreticalDuration)
    }

    const updatedEvent: Event = {
      ...event,
      startDate,
      endDate,
    }

    updatedEvents.push(updatedEvent)
  }

  return updatedEvents
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
