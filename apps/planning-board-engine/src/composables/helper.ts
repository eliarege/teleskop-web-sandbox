import { v4 } from 'uuid'

interface PlannedEvents {
  planKey: number
  machineId: number
  queueNumber: number
  recordTime: string
  jobOrder: string
  programNoList: string
  plannedStartTime: string
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

export function updateEventStates(ev: PlannedEvents[]) {
  return ev.map((e) => {
    return {
      ...e,
      deviation: (new Date(e.plannedStartTime).getTime() - new Date().getTime()) < 0
        ? 0
        : (Math.abs(new Date(e.plannedEndTime).getTime() - new Date().getTime())), // seconds
      // originally should be like this --> e.isStarted
      //   ? new Date(e.plannedEndTime) < new Date()
      //   : false,
      // because othervise there might be deviation
      isFinished: new Date(e.plannedEndTime) < new Date(),
      isStarted: new Date(e.plannedStartTime) < new Date(),
      notStarted: new Date(e.plannedStartTime) > new Date(),
      // ask how to check if this event is running or not
      isRunning: e.isStarted
        ? (new Date(e.plannedStartTime) < new Date() && new Date(e.plannedEndTime) > new Date())
        : false,
      // ask how to check if this event has an alarm
      hasAlarm: false,
    }
  })
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
