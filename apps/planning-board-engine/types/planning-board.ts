export interface UnscheduledTasks {
  planKey: number
  recordTime: string
  jobOrder: string
  fabricWeight: number
  plannedMachineId: number
  programCount: number
  programList: string
  plannedStartTime: string
  note: string
  erpFieldName: string | null
  batchParameterId: number
  theoreticalDuration: number
  isStopped: boolean
}

/**
 ------------------ ------------------ ------------------ ------------------
 */

export interface QueueBasedEventsBase {
  planKey: number
  machineId: number
  jobOrder: string
  programNoList: string
  theoreticalDuration: number
  fabricWeight: number
  note: string
  color: string
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean
  percentDone: number
}
export interface QueueBasedPlannedEventsRaw extends QueueBasedEventsBase {
  isPlanned: true
  plannedStartDate: string | Date
  queueNumber: number
  pinned: boolean
}

export interface QueueBasedActualEventsRaw extends QueueBasedEventsBase {
  isPlanned: false
  batchKey: number
  startTime: string | Date
  endTime: string | Date
  deviation: number
}

export type QueueBasedMergedEvents = (QueueBasedPlannedEventsRaw | QueueBasedActualEventsRaw)
export type QueueBasedModifiedMergedEvents = QueueBasedMergedEvents & {
  isRunning: boolean
  isFinished: boolean
  endDate: string | Date
  remainingTime: number
}
/**
 ------------------ ------------------ ------------------ ------------------
 */
export interface TimeBasedArchiveEvents {
  batchKey: number
  planKey: number
  machineId: number
  jobOrder: string
  programNoList: string
  startTime: Date | string
  endTime: Date | string
  theoreticalDuration: number
  fabricWeight: number
  partyNumber: string
  deviation: number
  plannedMachineId: number
  plannedStartTime: Date | string
  note: string
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean
}

export interface TimeBasedPlannedEvents {
  planKey: number
  machineId: number
  plannedStartTime: Date | string
  jobOrder: string
  programNoList: string
  theoreticalDuration: number
  fabricWeight: number
  isStarted: boolean
  isStopped: boolean
}
export interface TimeBasedEvents {
  plannedEvents: TimeBasedPlannedEvents[]
  archiveEvents: TimeBasedArchiveEvents[]
}
export interface TimeBasedPlannedEventStates extends TimeBasedPlannedEvents {
  plannedEndTime: Date | string
  isAlarm: boolean
  isLocked: boolean
}
export interface TimeBasedEventStates {
  plannedEventStates: {
    planKey: number
    machineId: number
    plannedStartTime: Date | string
    plannedEndTime: Date | string
    jobOrder: string
    programNoList: string
    theoreticalDuration: number
    fabricWeight: number
    isStarted: boolean
    isStopped: boolean
    isAlarm: boolean
    isLocked: boolean
    hasNote: boolean
  }[]
  mergedArchiveStates: {
    batchKey: number | string
    planKey: number | string
    machineId: number
    jobOrder: string
    programNoList: string
    startTime: Date | string
    endTime: Date | string
    theoreticalDuration: number
    fabricWeight: number
    partyNumber: string
    deviation: number
    note: string
    isDeleted: boolean
    isStarted: boolean
    isStopped: boolean
    isAlarm: boolean
    isLocked: boolean
    isDeviation: boolean
    isFinished: boolean
    hasNote: boolean
  }[]
}
