import { addSeconds } from 'date-fns'
import type { TimeBasedEventStates, TimeBasedEvents } from '../../../../types/planning-board'

export function updateTimeBasedEventStates(ev: TimeBasedEvents): TimeBasedEventStates {
  const plannedEvents = ev.plannedEvents.map((e) => {
    return {
      ...e,
      isRunning: e.isStarted && !e.isStopped,
      isAlarm: false,
      isLocked: false,
    }
  })

  const startedEvents = ev.startedEvents.map((e) => {
    return {
      ...e,
      isRunning: e.isStarted && !e.isStopped,
      isFinished: e.isStarted
        ? addSeconds(e.actualStartTime, e.theoreticalDuration) < new Date()
        : false,
      isAlarm: false,
      isLocked: false,
      isArchive: !(e.isStarted
        ? addSeconds(e.actualStartTime, e.theoreticalDuration) < new Date()
        : false),
    }
  })

  const finishedEvents = ev.finishedEvents.map((e) => {
    return {
      ...e,
      isFinished: e.isStarted
        ? e.endTime !== null || e.cancelTime !== null
        : false,
      isRunning: e.isStarted ? e.endTime === null && e.cancelTime === null : false,
      // TODO: ask how to check alarms
      isAlarm: false,
      isDeviation: e.deviation !== 0 || e.deviation !== null,
      isLocked: false,
      isArchive: true,
    }
  })

  return { plannedEvents, startedEvents, finishedEvents }
}
