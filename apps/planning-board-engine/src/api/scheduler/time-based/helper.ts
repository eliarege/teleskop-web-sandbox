import { differenceInSeconds, isBefore } from 'date-fns'
import type { TimeBasedEventStates, TimeBasedPlannedEventsExtended } from '../../../../types/planning-board'

export function updateTimeBasedEventStates(ev: TimeBasedPlannedEventsExtended[]): TimeBasedEventStates[] {
  return ev.map((e) => {
    return {
      ...e,
      deviation: e.isStarted
        ? differenceInSeconds(new Date(), e.plannedStartTime)
        : 0,
      // NOTE!: this is only for development! Production build should be like this:
      // isRunning: e.isStarted && !e.isFinished
      isRunning: isBefore(e.plannedStartTime, new Date()) && isBefore(new Date(), e.plannedEndTime),
      isAlarm: false,
      // NOTE!: this is only for development! Production build should be like this:
      // isFinished: e.isStarted ? isBefore(e.plannedEndTime, new Date()) : false,
      isFinished: isBefore(e.plannedEndTime, new Date()),
      isLocked: false,
    }
  })
}
