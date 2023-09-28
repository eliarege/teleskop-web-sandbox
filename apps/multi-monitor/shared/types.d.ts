export interface MachineDataRaw {
  id: number;
  name: string;
  groupName: string;
  elapsedTime: number | null;
  theoreticalDuration: number | null;
  autoManualStatus: number;
  loggedInOperatorNo: number;
  loggedInOperatorName: string;
  runningJobOrder: string;
  runningStartTime: string | null;
  runningBatchKey: number;
  runningBatchStatus: number;
  runningProgramId: number;
  runningProgramName: string;
  runningProgramList: string;
  runningStepNo: number;
  runningCommandNo: number;
  runningCommandName: string;
  runningAlarmNo: number;
  runningAlarmName: string;
  runningTheoreticalDuration: number;
  runningPhaseNo: number;
  runningPhaseName: string;
  runningPhaseStepNo: number;
  runningMachineCapacity: number;
  reqRecipeIndex: number;
  reqOrderIndex: number;
  reqOperationCode: number;
  reqTargetRecipe: number;
  reqTankNo: number;
  reqPriority: number;
  reqProgramNo: number;
  reqCommandNo: number;
  reqStatus: number;
  stopReason: string;
  stopReasonDateTime: string;
  connectionStatus: number;
  isSynchronizing: boolean;
  currentTemperature: number;
  currentAlarmStatus: number;
  runningCompletionRatio: number;
  manualReason: string;
  manualReasonDateTime: string;
  manualCommandActive: boolean;
  machineCapacity: number;
  machineIpAddress: string;
  totalConsumedWater: number;
  totalConsumedSalt: number;
  totalSteam: number;
  totalFM1: number;
  totalConsumedElectricity: number;
  erp: Record<string, any> | null;
}

export interface MachineData extends MachineDataRaw {
  runningStartTime: Date;
  stopReasonDateTime: Date;
  manualReasonDateTime: Date;
  newTheoreticalDuration: number;
  runningBatchRatio: number;
  runningStartHour: string;
}

export interface TableData extends MachineDataRaw {
  name: String;
  operator: String;
  starttime: String;
  program: String;
  batch: Number;
  alarm: Number;
}
export interface Trends {
  lastWeekTotalWater: number | null;
  currentWeekTotalWater: number | null;
  currentWeekElectricity: number | null;
  currentWeekFM: number | null;
  currentWeekSalt: number | null;
  currentWeekSteam: number | null;
  lastWeekElectricity: number | null;
  lastWeekFM: number | null;
  lastWeekSalt: number | null;
  lastWeekSteam: number | null;
}
export interface Interventions {
  interventKey: number;
  interventTime: string;
  machineId: number;
  batchKey: number;
  eventId: number;
  pOne: number | string | null;
  pTwo: number | string | null;
  pThree: number | string | null;
  explanation: string | null;
}
export interface NewInterventions extends Interventions {
  newTime: string;
}
export interface Recipe {
  planKey: number | null;
  recIndex: number | null;
  recNo: number | null;
  name: string | null;
  reqNumber: number | null;
  mainStep: number | null;
  parallelStep: number | null;
  recType: number | null;
  chemCode: string | null;
  materialName: string | null;
  amount: number | null;
  reqBatchNo: number | null;
  reqProgNo: number | null;
  otherUnit: number | null;
  phaseNo: number | null;
  phaseIndex: number | null;
  washingName: string | null;
  unit: number;
}
export interface NewRecipe extends Recipe {
  program: string;
  newPhaseIndex: number;
  newPhases: string;
  newAmount: string;
}
export interface MachineSettings {
  erp?: string;
}
export interface PieOptions {
  color: string[];
  cornerRadius: number;
  pieData: number[];
  startAngle: number;
  endAngle: number;
  padAngle: number;
  innerRadius: number;
  outerRadius: number;
  width: number;
  height: number;
}
export interface BatchLogs {
  id: number;
  planKey: number;
  machineId: number;
  jobOrder: string;
  programIndex: number;
  programNo: number;
  recipeType: string;
  requestprogramIndex: number;
  status: string;
  eventTime: number;
  explanation: string;
}
export interface NewBatchLogs extends BatchLogs {
  newTime: string;
}
