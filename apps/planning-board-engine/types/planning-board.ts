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

export interface TimeBasedPlannedEventsRaw {
  planKey: number
  machineId: number
  queueNumber: number
  recordTime: string
  jobOrder: string
  programNoList: string
  plannedStartTime: string
  theoreticalDuration: number
  fabricWeight: string
  partyNumber: string
  note: string
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean

}

export interface TimeBasedPlannedEventsExtended extends TimeBasedPlannedEventsRaw {
  plannedEndTime: string
  isDeviation: boolean
}

export interface TimeBasedEventStates extends TimeBasedPlannedEventsExtended {
  deviation: number
  isRunning: boolean
  isFinished: boolean
  isLocked: boolean
  isAlarm: boolean
}
