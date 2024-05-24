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
export interface UnplannedEventsRaw {
  planKey: number
  recordTime: string
  jobOrder: string
  plannedMachineId: number
  programCount: number
  plannedStartTime: string
  theoreticalDuration: number
  note: string
  erpParameters: Record<string, string>
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
export interface BatchText {
  id: number
  label: string
  value: string
}

export interface Batch {
  batchText: BatchText[]
  archiveDays: string
  showStops: {
    show: boolean
    color: string
  }
}

export interface CompletedBatch extends Batch {
  completedBatch: {
    batchText: BatchText
    isBatchFabricColor: boolean
    actualBatchFabricColor: string
    deviationBatchFabricColor: string
  }
}

export interface OngoingBatch extends Batch {
  ongoingBatch: {
    batchText: BatchText
    isBatchFabricColor: boolean
    actualBatchFabricColor: string
    deviationBatchFabricColor: string
  }
}

export interface PlannedBatch extends Batch {
  plannedBatch: {
    batchText: BatchText
    isBatchFabricColor: boolean
    actualBatchFabricColor: string
    deviationBatchFabricColor: string
  }
}

export type PtLocaleSettings = CompletedBatch & OngoingBatch & PlannedBatch
