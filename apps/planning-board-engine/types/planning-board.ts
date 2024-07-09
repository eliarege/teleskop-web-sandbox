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

export interface QueueBasedEventsBase extends BaseEvent {
  eventType: 'planned' | 'finished'
  planKey: number
  jobOrder: string
  programNoList: string
  theoreticalDuration: number
  fabricWeight: number
  fabricColor: string
  isPlanned: boolean
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean
}
export interface QueueBasedPlannedEventRaw extends QueueBasedEventsBase {
  eventType: 'planned'
  queueNumber: number
  pinned: boolean
}

export interface QueueBasedActualEventRaw extends QueueBasedEventsBase {
  eventType: 'finished'
  batchKey: number
  deviation: number
}
export interface QueueBasedStopEventRaw extends BaseEvent {
  eventType: 'stop'
  stopNumber: number | string
  stopReason: number | string
}

export interface BaseEvent {
  eventType: 'finished' | 'planned' | 'stop'
  machineId: number
  startTime: string
  endTime: string
  note: string
}

export type QueueBasedAnyEventRaw =
  | QueueBasedPlannedEventRaw
  | QueueBasedActualEventRaw
  | QueueBasedStopEventRaw

export type QueueBasedAnyEvent = QueueBasedAnyEventRaw & {
  isRunning: boolean
  isFinished: boolean
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
