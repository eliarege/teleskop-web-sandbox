export interface QueueBasedPlannedEvents {
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
  isRunning: boolean
  startDate: string
  endDate: string
}

export interface QueueBasedArchiveEvents {
  batchKey: number
  planKey: number
  machineId: number
  jobOrder: string
  programNoList: string
  startTime: string
  endTime: string | null
  cancelTime: string
  theoreticalDuration: number
  fabricWeight: number
  partyNumber: string
  deviation: number
  note: string
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean
  isFinished: boolean
  isRunning: boolean
  isAlarm: boolean
  isDeviation: boolean
  isLocked: boolean
  isArchive: boolean
}
