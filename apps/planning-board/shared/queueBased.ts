export interface QueueBasedEvents {
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
  isPlanned: boolean
  isFinished: boolean
  isRunning: boolean
  remainingTime: number
  plannedStartDate?: string | Date
  queueNumber?: number
  pinned?: boolean
  batchKey?: number
  startTime?: string | Date
  endTime?: string | Date
  cancelTime?: string | Date
  deviation?: number
}
