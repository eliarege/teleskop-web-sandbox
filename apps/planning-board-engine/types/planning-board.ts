import type { ValueOf } from '@teleskop/utils'
import type { BatchParameterType, StartingParameters } from '~/composables/enums'

export interface QueueBasedBaseEventRaw {
  eventType: 'planned' | 'finished' | 'ongoing' | 'stop' | 'unplanned'
  machineId: number
  startTime: string
  endTime: string
  note: string
}
export interface QueueBasedEventStop extends QueueBasedBaseEventRaw {
  eventType: 'stop'
  stopNumber: number | string
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
}
export interface QueueBasedActualEvent extends QueueBasedBaseEvent {
  eventType: 'finished' | 'ongoing'
  batchKey: number
  deviation: number
  isManual?: boolean
}
export interface QueueBasedNonActualEvent extends QueueBasedBaseEvent {
  eventType: 'planned' | 'unplanned'
  queueNumber: number
  pinned: boolean
  erpParameters: string
}

export type QueueBasedEvent =
  QueueBasedNonActualEvent |
  QueueBasedActualEvent |
  QueueBasedEventStop

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

export interface StartingParameter {
  machineId: number
  paramString: string
  paramLowLimit: number
  paramHighLimit: number
  paramType: ValueOf<typeof BatchParameterType> | null
}

export interface PlanParameter extends StartingParameter {
  value: number | string | null
}

export interface ValidatedPlanParameter extends PlanParameter {
  paramStatus: ValueOf<typeof StartingParameters>
}
