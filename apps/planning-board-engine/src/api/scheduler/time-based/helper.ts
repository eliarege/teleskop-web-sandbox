import { addSeconds } from 'date-fns'
import type { TimeBasedEventStates, TimeBasedEvents } from '../../../../types/planning-board'

export function updateTimeBasedEventStates(ev: TimeBasedEvents): TimeBasedEventStates {
  const plannedEventStates = ev.plannedEvents.map((e) => {
    return {
      ...e,
      plannedEndTime: addSeconds(e.plannedStartTime, e.theoreticalDuration),
      isAlarm: false,
      isLocked: false,
    }
  })
  const archiveActualEventStates = ev.archiveEvents.map((e) => {
    return {
      batchKey: e.batchKey,
      planKey: e.planKey,
      machineId: e.machineId,
      jobOrder: e.jobOrder,
      programNoList: e.programNoList,
      startTime: e.startTime,
      endTime: e.endTime,
      theoreticalDuration: e.theoreticalDuration,
      fabricWeight: e.fabricWeight,
      partyNumber: e.partyNumber,
      deviation: e.deviation,
      note: e.note,
      isDeleted: e.isDeleted,
      isStarted: e.isStarted,
      isStopped: e.isStopped,
      isAlarm: false,
      isLocked: false,
      isActual: true,
    }
  })
  const archivePlannedEventStates = ev.archiveEvents.map((e) => {
    return {
      batchKey: `P${e.batchKey}`,
      planKey: `P${e.planKey}`,
      machineId: e.machineId,
      jobOrder: e.jobOrder,
      programNoList: e.programNoList,
      startTime: e.plannedStartTime,
      endTime: addSeconds(e.plannedStartTime, e.theoreticalDuration),
      theoreticalDuration: e.theoreticalDuration,
      fabricWeight: e.fabricWeight,
      partyNumber: e.partyNumber,
      deviation: e.deviation,
      note: e.note,
      isDeleted: e.isDeleted,
      isStarted: e.isStarted,
      isStopped: e.isStopped,
      isAlarm: false,
      isLocked: false,
      isDeviation: e.deviation !== 0 || e.deviation !== undefined || e.deviation !== null,
      isFinished: e.isStopped && e.endTime !== null,
      isActual: false,
    }
  })
  const mergedArchiveStates = [...archiveActualEventStates, ...archivePlannedEventStates]
  console.log('mergedArchive', mergedArchiveStates)

  return { plannedEventStates, mergedArchiveStates }
}
