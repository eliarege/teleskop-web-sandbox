export interface TimeBasedEventStates {
  plannedEvents: TimeBasedPlannedStates[]
  startedEvents: TimeBasedStartedStates[]
  finishedEvents: TimeBasedFinishedStates[]
}
export interface TimeBasedEvents {
  plannedEvents: TimeBasedPlannedEvents[]
  startedEvents: TimeBasedStartedEvents[]
  finishedEvents: TimeBasedFinishedEvents[]
}
export interface TimeBasedPlannedEventsRaw {
  planKey: number
  machineId: number
  plannedStartTime: string
  jobOrder: string
  programNoList: string
  theoreticalDuration: number
  fabricWeight: number
  partyNumber?: number
  note: string
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean
}

export interface TimeBasedPlannedEvents extends TimeBasedPlannedEventsRaw {
  plannedEndTime: string
}
export interface TimeBasedPlannedStates extends TimeBasedPlannedEvents {
  isLocked: boolean
  isAlarm: boolean
  isRunning: boolean
}

export interface TimeBasedStartedEvents {
  planKey: number
  jobOrder: string
  machineId: number
  programNoList: string
  plannedStartTime: string
  actualStartTime: string
  theoreticalDuration: number
  fabricWeight: number
  note: string
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean
}

export interface TimeBasedStartedStates extends TimeBasedStartedEvents {
  isRunning: boolean
  isFinished: boolean
  isAlarm: boolean
  isLocked: boolean
  isArchive: boolean
}

export interface TimeBasedFinishedEvents {
  batchKey: number
  planKey: number
  machineId: number
  jobOrder: string
  programNoList: string
  startTime: string
  endTime: string
  cancelTime: string
  theoreticalDuration: number
  fabricWeight: number
  partyNumber: string
  deviation: number
  note: string
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean
}
export interface TimeBasedFinishedStates extends TimeBasedFinishedEvents {
  isFinished: boolean
  isAlarm: boolean
  isDeviation: boolean
  isArchive: boolean
}
