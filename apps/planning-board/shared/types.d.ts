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
  isAlarm: boolean
  isRunning: boolean
}

export interface UnplannedEventsRaw {
  planKey: number
  recordTime: string
  jobOrder: string
  plannedMachineId: number
  programCount: number
  plannedStartTime: string
  theoreticalDuration: number
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

// #region MachineRule
export interface MachineRule {
  name: string
  department: RuleField
  machines: RuleField
  rule: RecursiveRuleBlock
}
export interface RuleField {
  id: number
  name: string
}
export interface RecursiveRuleBlock {
  or: OrBlock[]
}
export interface OrBlock {
  and: AndBlock[]
}
export interface AndBlock {
  not?: NotBlock
  field?: Field
  operator?: Operator
  parameters?: number[] | string[]
}
export interface NotBlock {
  value: boolean
  label: string
}
export interface Field {
  label: string
  name: string
  type: ValueType
  source?: string
}
export interface Operator {
  name: string
  value: string
  type: ValueType | ValueType[]
  parameters: number
  execute(value: any, ...params: any[]): boolean
}
export type ValueType = 'string' | 'number' | 'values'
export interface RuleCondition {
  label: string
  value: boolean
}
export interface RuleCredentials {
  and: AndBlock[]
}
export interface RuleMachine {
  machineId: number
}
export interface MachineRuleInfo {
  id: number
  name: string
  departmentId: number
  expression: RuleCredentials[]
  ruleAssociations: RuleMachine[]
  createdAt: string
  updatedAt?: string
}
export interface NewMachineRuleInfo extends MachineRuleInfo {
  machine: RuleMachine[]
}
// #endregion
