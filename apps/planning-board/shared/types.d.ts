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
export interface RecipeRaw {
  planKey: number | null
  recIndex: number | null
  recNo: number | null
  name: string | null
  reqNumber: number | null
  mainStep: number | null
  parallelStep: number | null
  recType: number | null
  chemCode: string | null
  materialName: string | null
  amount: number | null
  reqBatchNo: number | null
  reqProgNo: number | null
  otherUnit: number | null
  phaseNo: number | null
  phaseIndex: number | null
  washingName: string | null
  unit: number
}
export interface Recipe {
  autoRecipe: RecipeRaw[]
  manualRecipe: RecipeRaw[]
}
