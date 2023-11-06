export interface MachineList {
  id: number
  name: string
  groupNo: number
  groupName: string
  machineCapacity: number
}

export interface PlannedEvents {
  planKey: number
  recordTime: string | Date
  jobOrder: string
  machineId: number
  plannedMachine: number
  startedMachine: number | null
  partlyPlanned: number
  isCorrection: number
  isCoupled: number
  programCount: number
  programNoList: number[]
  plannedStartTime: string | Date
  actualStartTime: string | Date | null
  note: string
  theoricalDuration: number
  fabricWeight: number | null
  customerName: string | null
}

export interface UnplannedEvents {
  id: number
  name: string
  duration: number
  process: number
  processName: string
  durationUnit: 'h' | 'm'
  iconCls?: string
  constraintType?: string
  constraintDate?: string | Date
}
