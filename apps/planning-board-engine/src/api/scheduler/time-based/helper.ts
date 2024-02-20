import { addSeconds } from 'date-fns'
import type { TimeBasedArchiveEvents, TimeBasedEventStates, TimeBasedEvents } from '../../../../types/planning-board'
import { hasNote } from '../../../composables/helper'

async function mapEvents(e: TimeBasedArchiveEvents, isPlanned: boolean) {
  return {
    batchKey: isPlanned ? `P${e.batchKey}` : e.batchKey,
    planKey: isPlanned ? `P${e.planKey}` : e.planKey,
    machineId: e.machineId,
    jobOrder: e.jobOrder,
    programNoList: e.programNoList,
    startTime: isPlanned ? e.plannedStartTime : e.startTime,
    endTime: isPlanned ? addSeconds(e.plannedStartTime, e.theoreticalDuration) : e.endTime,
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
    isActual: !isPlanned,
    isArchive: true,
    hasNote: await hasNote(e.jobOrder),
  }
}
export async function updateTimeBasedEventStates(ev: TimeBasedEvents): Promise<TimeBasedEventStates> {
  const plannedEventStates = await Promise.all(ev.plannedEvents.map(async (e) => {
    return {
      ...e,
      plannedEndTime: addSeconds(e.plannedStartTime, e.theoreticalDuration),
      isAlarm: false,
      isLocked: false,
      notStarted: !e.isStarted,
      hasNote: await hasNote(e.jobOrder),
    }
  }))

  const archiveActualEventStates = await Promise.all(ev.archiveEvents.map(async e => mapEvents(e, false)))
  const archivePlannedEventStates = await Promise.all(ev.archiveEvents.map(async e => mapEvents(e, true)))

  const mergedArchiveStates = [...archiveActualEventStates, ...archivePlannedEventStates]
  return { plannedEventStates, mergedArchiveStates }
}
