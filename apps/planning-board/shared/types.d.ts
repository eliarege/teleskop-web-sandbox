export interface MachineList {
  id: number
  name: string
  groupNo: number
  groupName: string
  machineCapacity: number
}

export interface PlannedEventsRaw {
  id: number
  planKey: number
  machineId: number
  queueNumber: number
  recordTime: string
  jobOrder: string
  programNoList: string
  plannedStartTime: string
  theoreticalDuration: number
  fabricWeight: number
  partyNumber: string
  note: string
}
export interface PlannedEvents {
  planKey: number
  machineId: number
  queueNumber: number
  recordTime: string
  jobOrder: string
  programNoList: string
  plannedStartTime: string
  plannedEndTime: string
  theoreticalDuration: number
  fabricWeight: number
  partyNumber: string
  note: string
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean
  isDeviation: boolean
  deviation: number
  isFinished: boolean
  notStarted: boolean
  hasAlarm: boolean
  isRunning: boolean
}

export interface UnplannedEventsRaw {
  planKey: number
  recordTime: string
  jobOrder: string
  plannedMachineId: number
  programCount: number
  plannedStartTime: string
  theoricalDuration: number
  fabricWeight?: number
  note: string
  erpFieldName?: string
  batchParameterId?: number
  value?: string
}

export interface UnplannedEvents extends UnplannedEventsRaw {
  id: string | number
  name: string
  duration: number
  durationUnit: 'millisecond' | 'second' | 'minute' | 'hour' | 'day'
  constraintDate: string | Date
}
