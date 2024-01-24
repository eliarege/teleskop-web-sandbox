import type { ArchiveEventStates, QueueBasedArchiveEvents, QueueBasedPlannedEventsExtended, QueueBasedPlannedEventsRaw } from '../../../../types/planning-board'

export function updateRawQueueEventStates(ev: QueueBasedPlannedEventsRaw[]): QueueBasedPlannedEventsExtended[] {
  return ev.map((e) => {
    /**
     isFinished: event başladı ve bitti
     isRunning: event başladı ama bitmedi
     hasAlarm: event'e ait alarm var mı
     isDeviation: deviation var mı
     */
    return {
      ...e,
      isRunning: e.isStarted && !e.isStopped,
    }
  })
}

export function updateArchiveQueueEventStates(ev: QueueBasedArchiveEvents[]): ArchiveEventStates[] {
  return ev.map((e) => {
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
}
