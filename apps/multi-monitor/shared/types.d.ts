export interface MachineDataRaw {
  id: number
  name: string
  groupName: string
  elapsedTime: number | null
  theoreticalDuration: number | null
  autoManualStatus: number
  loggedInOperatorNo: number
  loggedInOperatorName: string
  runningJobOrder: string
  runningStartTime: string | null
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
  runningFabricWeight: number
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
  machineError?: boolean
  stopReasonDateTime: string
  connectionStatus: number
  isSynchronizing: boolean
  currentTemperature: number
  currentAlarmStatus: number
  runningCompletionRatio: number
  manualReason: string
  manualReasonDateTime: string
  manualCommandActive: boolean
  machineCapacity: number
  machineIpAddress: string
  totalConsumedWater: number
  totalConsumedSalt: number
  totalSteam: number
  totalFM1: number
  totalConsumedElectricity: number
  runningPrgElapsedTime?: number
  runningPrgTotalTheoreticDuration?: number
  erp: Record<string, any> | null
}
export interface MachineData extends MachineDataRaw {
  runningStartTime: Date
  stopReasonDateTime: Date
  manualReasonDateTime: Date
  newTheoreticalDuration: number
  runningStartHour: string
}
export interface TableData extends MachineDataRaw {
  name: string
  operator: string
  starttime: string
  program: string
  batch: number
  alarm: number
}
export interface Trends {
  currentWeekTotalWater: number
  currentWeekElectricity: number
  currentWeekFM: number
  currentWeekSalt: number
  currentWeekSteam: number
  currentWeekProduction: number
  lastWeekTotalWater: number
  lastWeekElectricity: number
  lastWeekFM: number
  lastWeekSalt: number
  lastWeekSteam: number
  lastWeekProduction: number
}
export interface Interventions {
  interventKey: number
  interventTime: string
  machineId: number
  batchKey: number
  eventId: number
  pOne: number | string | null
  pTwo: number | string | null
  pThree: number | string | null
  explanation: string | null
}
export interface NewInterventions extends Interventions {
  newTime: string
}
export interface Recipe {
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
export interface NewRecipe extends Recipe {
  program: string
  newPhaseIndex: number
  newPhases: string
  newAmount: string
}
export interface MachineSettings {
  erp?: string
}
export interface PieOptions {
  color: string[]
  cornerRadius: number
  pieData: number[]
  startAngle: number
  endAngle: number
  padAngle: number
  innerRadius: number
  outerRadius: number
  width: number
  height: number
}
export interface BatchLogs {
  id: number
  planKey: number
  machineId: number
  jobOrder: string
  programIndex: number
  programNo: number
  recipeType: string
  requestprogramIndex: number
  status: string
  eventTime: number
  explanation: string
}
export interface NewBatchLogs extends BatchLogs {
  newTime: string
}
export interface Alarm {
  alarmNo: number
  alarmName: string
  showOnScreen: boolean
}

export interface Command {
  commandNo: number
  commandName: string
  alarms: Alarm[]
}

export interface MachineAlarm {
  machineId: number
  machineName: string
  commands: Command[]
}

export interface MachineAlarmListRaw {
  commandNo: number
  alarmNo: number
  alarmName: string
  alarmStartTime: string
  showOnScreen: boolean
  alarmStatus: 0 | 1
}

export interface MachineAlarmList {
  machineId: number
  machineName: string
  batchKey: number
  jobOrder: string
  operatorName: string
  currentTemperature: number
  alarmList: MachineAlarmListRaw[]
}

export interface MachineAlarmStats {
  alarmsInLast24Hours: number
}
export type FetchStatus = 'idle' | 'pending' | 'error' | 'success'
