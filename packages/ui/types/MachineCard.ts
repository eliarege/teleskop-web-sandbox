export interface MachineCardDataRaw {
  id: number
  name: string
  groupName: string
  elapsedTime: number | null
  theoreticalDuration: number | null
  autoManualStatus: number
  loggedInOperatorNo: number
  loggedInOperatorName: string
  runningJobOrder: string
  runningStartTime: Date | string | null
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
  reqProgramNo: number
  reqCommandNo: number
  reqStatus: number
  stopReason: string
  stopReasonDateTime: Date | string
  connectionStatus: number
  isSynchronizing: boolean
  currentTemperature: number
  currentAlarmStatus: number
  runningCompletionRatio: number
  manualReason: string
  manualReasonDateTime: Date | string
  manualCommandActive: boolean
  machineCapacity: number
  machineIpAddress: string
  totalConsumedWater: number
  totalConsumedSalt: number
  totalSteam: number
  totalFM1: number
  totalConsumedElectricity: number
  erp: Record<string, any> | null
}

export interface MachineCardData extends MachineCardDataRaw {
  runningStartTime: Date | string
  stopReasonDateTime: Date | string
  manualReasonDateTime: Date | string
  newTheoreticalDuration: number
  runningBatchRatio: number
  runningStartHour: string
}
