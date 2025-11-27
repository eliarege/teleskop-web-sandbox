export interface QueueBasedBaseEventRaw {
  eventType: 'planned' | 'finished' | 'ongoing' | 'stop' | 'unplanned'
  machineId: number
  startTime: string
  endTime: string
  isManual?: boolean
}
export interface QueueBasedEventStop extends QueueBasedBaseEventRaw {
  eventType: 'stop'
  stopNumber: number
  stopReason: string
}
export interface QueueBasedBaseEvent extends QueueBasedBaseEventRaw {
  eventType: 'planned' | 'finished' | 'ongoing' | 'unplanned'
  planKey: number
  jobOrder: string
  programList: string
  programCount: number
  theoreticalDuration: number
  fabricWeight: number
  fabricColor: number
  note: string
  isManual: boolean
}
export interface QueueBasedActualEvent extends QueueBasedBaseEvent {
  eventType: 'finished' | 'ongoing'
  batchKey: number
  deviation: number
}
export interface QueueBasedNonActualEvent extends QueueBasedBaseEvent {
  eventType: 'planned' | 'unplanned'
  queueNumber: number
  pinned: boolean
  recordTime: string
}
export interface QueueBasedUnplannedEvent extends QueueBasedNonActualEvent {
  eventType: 'unplanned'
  erpParameters: string
}

export type QueueBasedEvent =
  QueueBasedNonActualEvent |
  QueueBasedActualEvent |
  QueueBasedEventStop
