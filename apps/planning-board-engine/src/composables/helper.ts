import { v4 } from 'uuid'

interface PlannedEvents {
  planKey: number
  machineId: number
  queueNumber: number
  recordTime: string
  jobOrder: string
  programNoList: string
  plannedStartTime: string
  actualStartTime: string
  plannedEndTime: string
  theoreticalDuration: number
  fabricWeight: number
  partyNumber: string
  note: string
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean
  isDeviation: boolean
  deviation: number
  isFinished: boolean
  hasAlarm: boolean
  isRunning: boolean
}
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
      startDate = new Date()
    } else {
      const previousEndDate = updatedEvents[updatedEvents.length - 1].endDate
      startDate = new Date(previousEndDate.getTime() + 5 * 60 * 1000)
    }

    endDate = new Date(startDate.getTime() + event.theoreticalDuration * 1000)

    const updatedEvent: Event = {
      ...event,
      startDate,
      endDate,
    }

    updatedEvents.push(updatedEvent)
  }

  return updatedEvents
}
