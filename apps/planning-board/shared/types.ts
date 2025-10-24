import type { QueueBasedBaseEvent } from './queueBased'

export interface MachineStatus {
  id: number
  name: string
  machineCapacity: number
  machineIpAddress: string
  groupName: string
  elapsedTime: number
  theoreticalDuration: number
  autoManualStatus: number
  loggedInOperatorNo: number
  loggedInOperatorName: string
  runningJobOrder: string
  runningStartTime: string
  runningBatchKey: number
  runningBatchStatus: number
  runningProgramId: number
  runningProgramName: string
  runningProgramList: string
  runningStepNo: number
  runningCommandNo: number
  runningCommandName: string
  runningAlarmNo: number
  runningAlarmName: string
  runningTheoreticalDuration: number
  runningPhaseNo: number
  runningPhaseName: string
  runningPhaseStepNo: number
  runningMachineCapacity: number
  reqRecipeIndex: number
  reqOrderIndex: number
  reqOperationCode: number
  reqTargetRecipe: number
  reqTankNo: number
  reqPriority: number
  totalRequestCount: number
  reqProgramNo: number
  reqCommandNo: number
  reqStatus: number
  stopReason: string
  stopReasonDateTime: string
  connectionStatus: number
  isSynchronizing: boolean
  currentTemperature: number
  currentAlarmStatus: number
  runningCompletionRatio: number
  manualReason: string
  manualReasonDateTime: string
  manualCommandActive: boolean
  totalAlarmCount: number
}
export interface MachineData extends MachineStatus {
  runningStartTime: Date
  stopReasonDateTime: Date
  manualReasonDateTime: Date
  newTheoreticalDuration: number
  runningBatchRatio: number
  runningStartHour: string
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
  weighedAmount: number | null
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

export interface PtLocaleSettings {
  deviationColor: string
  completedBatchColor: string
  completedBatchText: (keyof QueueBasedBaseEvent)[]
  completedBatchFabricColor: boolean
  ongoingBatchColor: string
  ongoingBatchText: (keyof QueueBasedBaseEvent)[]
  ongoingBatchFabricColor: boolean
  plannedBatchColor: string
  plannedBatchText: (keyof QueueBasedBaseEvent)[]
  plannedBatchFabricColor: boolean
  showStops: { show: boolean, color: string }
}

export interface ProgramHeader {
  name: string
  author: string | null
  comment: string | null
  typeId: number
  createdAt: Date | null
  updatedAt: Date | null
  steps: ProgramStep[]
  updatedAtTBB: string | null
  programState: number | null
  isChanged: boolean | null
  tbbProgramChangedEvent: boolean | null
}

export interface Program extends ProgramHeader {
  icon: string | null
  programNo: number
  typeName: string
  machineId: number
  machineName: string
}
export interface ProgramStep {
  stepId: number
  mainCommand: ProgramStepCommand
  parallelCommands: ProgramStepCommand[]
}
export interface ProgramStepCommand {
  commandId: number
  commandNo: number | null
  parameters: ParameterItem[]
  ioList: ioListItem[]
}
export interface ParameterItem {
  value: number
  index: number
}
export interface ioListItem {
  ioId: number
  ioIndex: number
  value: [number, number][]
}

export interface PlanParameters {
  id: number
  planKey: number
  machineId: number
  paramString: string
  paramHighLimit: number
  paramLowLimit: number
  value: string | number
  unitCode: number
  paramStatus: 0 |
  1 |
  2 |
  3
}
export interface PlanParameterProps {
  planKey: number
  isBatchStarted: boolean
  machineId: number
  missingParams: PlanParameters[]
  isSendMachine: boolean
  uploadData?: {
    program: string
    machineId: number
    planKey: number
    jobOrder?: string
    machineIp?: string
  }
}
