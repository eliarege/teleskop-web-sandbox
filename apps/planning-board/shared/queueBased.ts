export interface QueueBasedEventsBase extends BaseEvent {
  eventType: 'planned' | 'finished'
  planKey: number
  jobOrder: string
  programNoList: string
  theoreticalDuration: number
  fabricWeight: number
  fabricColor: number
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
  stopNumber: number
  stopReason: number
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
