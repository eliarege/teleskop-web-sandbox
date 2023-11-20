export interface MachineList {
  id: number
  name: string
  groupNo: number
  groupName: string
  machineCapacity: number
}

export interface PlannedEventsRaw {
  planKey: number
  recordTime: string | Date
  jobOrder: string
  plannedMachine: number
  startedMachine: number
  isDeleted: boolean
  isStarted: boolean
  isStopped: boolean
  programCount: number
  plannedStartTime: string | Date
  actualStartTime: string | Date
  theoricalDuration: number
  fabricWeight: number
  customerName: string
}
export interface PlannedEvents {
  id: number
  name: string
  resourceId: number | string
  startDate: string | Date
  endDate: string | Date
  iconCls?: string
  resizable: boolean
  draggable: boolean
  editable: boolean
}

export interface UnplannedEventsRaw {
  planKey: number
  recordTime: string | Date
  jobOrder: string
  plannedMachineId: number
  programCount: number
  plannedStartTime: string | Date
  isDeleted: 0 | 1
  isStarted: 0 | 1
  isStopped: 0 | 1
  theoricalDuration?: number
  fabricWeight?: number
  note?: string
  erpFieldName?: string
  batchParameterId?: string
  value?: string | number
  iconCls?: string
}

export interface UnplannedEvents {
  id: string | number
  name: string
  duration: number
  durationUnit: 'millisecond' | 'second' | 'minute' | 'hour' | 'day'
  constraintDate: string | Date
}
