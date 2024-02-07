export interface UnscheduledTasks {
  planKey: number
  recordTime: string
  jobOrder: string
  plannedMachineId: number
  programCount: number
  programList: string
  plannedStartTime: string
  fabricWeight: string
  note: string
  erpFieldName: string | null
  batchParameterId: number
  theoreticalDuration: number
  isStopped: boolean
}

export interface QueueBasedPlannedEventsRaw {
  planKey: number
  machineId: number
  queueNumber: number
  jobOrder: string
  programNoList: string
  theoreticalDuration: number
  fabricWeight: string
  partyNumber: string
  note: string
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean
}
export interface QueueBasedPlannedEventsExtended extends QueueBasedPlannedEventsRaw {
  // isDeviaiton: boolean
  isRunning: boolean
}

export interface QueueBasedArchiveEvents extends QueueBasedPlannedEventsRaw {
  batchKey: number
  startTime: Date | string
  endTime: Date | string
  cancelTime: Date | string
  deviation: number
}

export interface ArchiveEventStates extends QueueBasedArchiveEvents {
  isDeviation: boolean
  isRunning: boolean
  isFinished: boolean
  isLocked: boolean
  isAlarm: boolean
}

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
