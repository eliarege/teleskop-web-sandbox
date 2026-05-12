/**
 * Data models for all database tables used by the communications driver.
 * Each table has:
 *  - A TABLE constant (the raw SQL table name)
 *  - A COLUMNS map used for knex `.column()` aliasing (camelCase → DB column)
 *  - A model interface with readable camelCase property names
 *  - Insert / update data types
 */

import { TonelloChemicalRequestEvent } from '@teleskop/core'
import type {
  AutoManualStatus,
  BatchStartEndState,
  CancelDetail,
  ConnectionStatus,
  MaterialType,
  RequestStatus,
  RequestType,
} from './enums'

export type { BatchStartEndState, MaterialType, RequestType } from './enums'

// ── BADATA ──────────────────────────────────────────────────────────────────

export const BATCH_DATA_TABLE = 'BADATA' as const

export const BATCH_DATA_COLUMNS = {
  batchKey: 'BATCHKEY',
  batchReference: 'BATCHREFERENCE',
  machineId: 'MACHINEID',
  machineCode: 'MACHINECODE',
  jobOrder: 'JOBORDER',
  startTime: 'STARTTIME',
  endTime: 'ENDTIME',
  cancelTime: 'CANCELTIME',
  endConfirmTime: 'ENDCONFIRMTIME',
  programCount: 'PRGCOUNT',
  programNoList: 'PROGRAMNOLIST',
  stopReason: 'STOPREASON',
  correctionCount: 'CORRECTIONCOUNT',
  isCorrection: 'ISCORRECTION',
  correctionReason: 'CORRECTIONREASON',
  operatorCode: 'OPRCODE',
  operatorName: 'OPRNAME',
  clientCode: 'CLIENTCODE',
  archived: 'ARCHIVED',
  theoreticalDuration: 'THEORETICDURAT',
  realDuration: 'REALDURATION',
  deviation: 'DEVIATION',
  stopDurationOperator: 'STOP_DURATION_OPER',
  stopDurationAlarm: 'STOP_DURATION_ALR',
  stopDurationWarningAlarm: 'STOP_DURATION_WARNING_ALR',
  actualTheoreticalDuration: 'ACTUAL_THEORETICDURAT',
  fabricWeight: 'FABRIC_WEIGHT',
  transferStatus: 'TRANSFERSTATUS',
  color: 'Color',
  startedWithProcess: 'startedWithPrcss',
  processId: 'prcssId',
  cancelDetail: 'CANCELDETAIL',
  theoricElectricity: 'theoricElectricity',
  theoricWater: 'theoricWater',
  theoricSteam: 'theoricSteam',
  recipeTypeId: 'RECIPETYPEID',
  finishReasonId: 'FINISHREASONID',
  additionStarted: 'ADDITIONSTARTED',
  partCount: 'PARTCOUNT',
  planKey: 'PLANKEY',
  customerName: 'CUSTOMERNAME',
  partyNumber: 'PARTYNUMBER',
  plannedMachineId: 'PLANNEDMACHINEID',
  style: 'STYLE',
  item: 'ITEM',
  colorName: 'COLORNAME',
} as const satisfies Record<string, string>

export interface BatchData {
  batchKey: number
  batchReference: string
  machineId: number
  machineCode: string
  /** Job order code. Set by the operator or by job order / recipe / ERP software. */
  jobOrder: string
  /** Job order start time. */
  startTime: Date
  /**
   * Job order end time.
   * If both `endTime` and `cancelTime` are null the job order is still running.
   * Finished job orders write to `endTime`; cancelled ones write to `cancelTime`.
   */
  endTime: Date | null
  /** Set when the job order is cancelled. See `endTime`. */
  cancelTime: Date | null
  endConfirmTime: Date | null
  programCount: number
  /** Program numbers in the job order (e.g. `[1101, 2502, 3502]`). */
  programNoList: number[] | null
  /** Is correction? */
  stopReason: number | null
  correctionCount: number | null
  isCorrection: boolean
  correctionReason: string | null
  operatorCode: number | null
  operatorName: string | null
  clientCode: string | null
  archived: boolean
  /** Theoretical duration of the job order **(seconds)**. */
  theoreticalDuration: number | null
  /** Actual duration of the job order **(seconds)**. Updated when the job order ends or is cancelled. */
  realDuration: number | null
  /** Difference between theoretical and actual duration. */
  deviation: number | null
  /** Operator-caused stop duration **(seconds)**, written when job order ends. */
  stopDurationOperator: number | null
  /** Delays caused by command alarms **(seconds)**, written when job order ends. */
  stopDurationAlarm: number | null
  /** Delays caused by warning commands **(seconds)**, written when job order ends. */
  stopDurationWarningAlarm: number | null
  /** Theoretical time based on actually running programs **(seconds)**. */
  actualTheoreticalDuration: number | null
  fabricWeight: number | null
  transferStatus: number | null
  color: number | null
  startedWithProcess: boolean | null
  processId: number | null
  /** For cancelled job orders: `1` included in production · `2` not included. Default `1`. */
  cancelDetail: CancelDetail
  /** Theoretical electricity calculation was active when the job order started. */
  theoricElectricity: boolean
  /** Theoretical water calculation was active when the job order started. */
  theoricWater: boolean
  /** Theoretical steam calculation was active when the job order started. */
  theoricSteam: boolean
  recipeTypeId: number
  finishReasonId: number | null
  additionStarted: boolean
  partCount: number | null
  /** Foreign key to `DYBFBATCHPLAN.PLANKEY` if the job order has a recipe in Dispensing Manager. */
  planKey: number | null
  customerName: string | null
  partyNumber: string | null
  /** If the job order has a recipe, the originally planned machine ID. */
  plannedMachineId: number | null
  style: number | null
  item: number | null
  colorName: number | null
}

export interface BatchDataInsert {
  batchReference: string
  machineId: number
  machineCode: string
  jobOrder: string
  startTime: Date
  programCount: number
  isCorrection: boolean
  archived: boolean
  cancelDetail?: number
  theoricElectricity?: boolean
  theoricWater?: boolean
  theoricSteam?: boolean
  recipeTypeId?: number
  additionStarted?: boolean
  programNoList?: number[]
  stopReason?: number
  correctionCount?: number
  correctionReason?: string
  operatorCode?: number
  operatorName?: string
  clientCode?: string
  theoreticalDuration?: number
  fabricWeight?: number
  color?: number
  startedWithProcess?: boolean
  processId?: number
  planKey?: number
  customerName?: string
  partyNumber?: string
  plannedMachineId?: number
  style?: number
  item?: number
  colorName?: number
}

export type BatchDataUpdate = Partial<Omit<BatchData, 'batchKey'>>

// ── BAALARM ──────────────────────────────────────────────────────────────────

export const BATCH_ALARM_TABLE = 'BAALARM' as const

export const BATCH_ALARM_COLUMNS = {
  batchKey: 'BATCHKEY',
  batchAlarmNo: 'BATCHALARMNO',
  alarmNo: 'ALARMNO',
  programNo: 'PROGNO',
  commandNo: 'COMMANDNO',
  startTime: 'STARTTIME',
  confirmTime: 'CONFIRMTIME',
  endTime: 'ENDTIME',
  explanation: 'EXPLANATION',
  alarmType: 'ALARMTYPE',
  isParallel: 'ISPARALLEL',
  programIndex: 'PRGINDEX',
  phaseNo: 'PHASENO',
  phaseIndex: 'PHASEINDEX',
} as const satisfies Record<string, string>

export interface BatchAlarm {
  batchKey: number
  batchAlarmNo: number
  alarmNo: number
  programNo: number
  /** Command number that generated the alarm. `-1` when `alarmType >= 4`. */
  commandNo: number
  /** Alarm start time. */
  startTime: Date
  /** Time the alarm was confirmed by the operator. */
  confirmTime: Date | null
  endTime: Date | null
  explanation: string | null
  /**
   * Alarm type:
   * - `0` Command time exceeded (causes stop), ALARMNO [100..199]
   * - `1` Equipment alarm, ALARMNO [100..199]
   * - `2` Warning alarm, ALARMNO [100..199]
   * - `3` Warning command time exceeded, ALARMNO [100..199]
   * - `4` Interlock alarm, ALARMNO [200..499]
   * - `5` PLC alarm, ALARMNO [500..599]
   * - `6` Software alarm, ALARMNO [600..699]
   * - `7` Calibration alarm, ALARMNO [700..799]
   * - `8` Coupled alarm, ALARMNO [800..899]
   * - `9` Switched to manual mode, ALARMNO 5000
   * - `10` Job order stopped, ALARMNO 6000
   * - `12` System alarm in EPAC systems
   */
  alarmType: number | null
  /** `1` parallel command · `2` main command. Meaningful only when `commandNo !== -1`. */
  isParallel: boolean | null
  /** Position of the program within the job order. */
  programIndex: number
  phaseNo: number
  phaseIndex: number
}

export interface BatchAlarmInsert {
  batchKey: number
  batchAlarmNo: number
  alarmNo: number
  programNo: number
  commandNo: number
  startTime: Date
  alarmType?: number
  isParallel?: boolean
  explanation?: string
  programIndex?: number
  phaseNo?: number
  phaseIndex?: number
}

// ── BAACTUALPRGSTEPS ─────────────────────────────────────────────────────────

export const BATCH_STEP_TABLE = 'BAACTUALPRGSTEPS' as const

export const BATCH_STEP_COLUMNS = {
  batchKey: 'BATCHKEY',
  programNo: 'PRGNO',
  stepNo: 'STEPNO',
  parallelStepNo: 'PARALLELSTEPNO',
  commandNo: 'COMMANDNO',
  startTime: 'STARTTIME',
  endTime: 'ENDTIME',
  commandEndStep: 'COMMANDENDSTEP',
  theoreticalDuration: 'THEORETICDURATION',
  programIndex: 'PRGINDEX',
  phaseNo: 'PHASENO',
  phaseIndex: 'PHASEINDEX',
  optimizedTheoreticalDuration: 'OPTIMIZEDTHEORETICDURATION',
} as const satisfies Record<string, string>

export interface BatchStep {
  batchKey: number
  programNo: number
  stepNo: number
  /** Position of the command within the step (parallel index). */
  parallelStepNo: number
  commandNo: number
  startTime: Date
  endTime: Date | null
  commandEndStep: number | null
  /** Theoretical duration of the command **(seconds)**. Only present when `parallelStepNo = 0`. */
  theoreticalDuration: number | null
  /** Position of the program within the job order. */
  programIndex: number
  phaseNo: number | null
  phaseIndex: number | null
  optimizedTheoreticalDuration: number | null
}

export interface BatchStepInsert {
  batchKey: number
  programNo: number
  stepNo: number
  parallelStepNo: number
  commandNo: number
  startTime: Date
  theoreticalDuration?: number
  programIndex?: number
  phaseNo?: number
  phaseIndex?: number
  optimizedTheoreticalDuration?: number
}

// ── TFMACHINESTATUS ──────────────────────────────────────────────────────────

export const MACHINE_STATUS_TABLE = 'TFMACHINESTATUS' as const

export const MACHINE_STATUS_COLUMNS = {
  machineId: 'MACHINEID',
  updateTime: 'UPDATETIME',
  runningJobOrder: 'RUNNING_JOBORDER',
  runningJobOrderStartTime: 'RUNNING_JOBORDERSTARTTIME',
  runningProgramNoList: 'RUNNING_PROGNOLIST',
  runningBatchKey: 'RUNNING_BATCHKEY',
  runningBatchStatus: 'RUNNING_BATCHSTATUS',
  runningAutoManStatus: 'RUNNING_AUTOMANSTATUS',
  runningProgramNo: 'RUNNING_PROGRAMID',
  runningProgramName: 'RUNNING_PROGRAMNAME',
  runningStepNo: 'RUNNING_STEPNO',
  runningCommandNo: 'RUNNING_CMDNO',
  runningCommandName: 'RUNNING_CMDNAME',
  runningAlarmNo: 'RUNNING_ALARMNO',
  runningAlarmName: 'RUNNING_ALARMNAME',
  runningOperatorNo: 'RUNNING_OPRNO',
  runningOperatorName: 'RUNNING_OPRNAME',
  runningTheoreticalTime: 'RUNNING_THEOTIME',
  runningPhaseNo: 'RUNNING_PHASENO',
  runningPhaseName: 'RUNNING_PHASENAME',
  runningPhaseStepNo: 'RUNNING_PHASESTEPNO',
  isCoupled: 'ISCOUPLED',
  requestBatchKey: 'REQ_BATCHKEY',
  requestJobOrder: 'REQ_JOBORDER',
  requestRecipeIndex: 'REQ_RECIPEINDEX',
  requestOrderIndex: 'REQ_REQORDERINDEX',
  requestOperationCode: 'REQ_OPERATIONCODE',
  requestTargetRecipe: 'REQ_TARGETRECIPE',
  requestTankNo: 'REQ_TANKNO',
  requestPriority: 'REQ_PRIORITY',
  requestTotalCount: 'REQ_TOTALREQCOUNT',
  requestProgramNo: 'REQ_PRGNO',
  requestCommandNo: 'REQ_CMDNO',
  requestStatus: 'REQ_STATUS',
  consumptionElectricityStart: 'CONSUMPTION_ELECTRICITY_START',
  consumptionElectricityExportStart: 'CONSUMPTION_ELECTRICITY_EXPORT_START',
  consumptionElectricityCapacitiveStart: 'CONSUMPTION_ELECTRICITY_CAPACITIVE_START',
  consumptionElectricityReactiveStart: 'CONSUMPTION_ELECTRICITY_REACTIVE_START',
  lastReceivedEventDate: 'LASTRECEIVEDEVENTDATE',
  lastReceivedEventId: 'LASTRECEIVEDEVENTID',
  lastReceivedBatchEventDate: 'LASTRECEIVEDBATCHEVENTDATE',
  lastEventProcessDate: 'LASTEVENTPROCESSDATE',
  lastEventProcessId: 'LASTEVENTPROCESSID',
  lastReferenceNumber: 'LASTREFERENCENUMBER',
  lastReferenceDate: 'LASTREFERENCEDATE',
  lastEventCode: 'LASTEVENTCODE',
  lastEventId: 'LASTEVENTID',
  lastEventDate: 'LASTEVENTDATE',
  stopReason: 'stopReason',
  stopReasonDateTime: 'stopReasonDateTime',
  connectionStatus: 'ConnectionStatus',
  isSynchronizing: 'IsSynchronizing',
  currentTemperature: 'currentTemp',
  currentAlarmStatus: 'currentAlarmStatus',
  completionRatio: 'runningCompletionRatio',
  lastPingFail: 'lastPingFail',
  lastSoapFail: 'lastSoapFail',
  waterConsumption1: 'conWater1',
  waterConsumption2: 'conWater2',
  waterConsumption1Last: 'conWater1Last',
  waterConsumption2Last: 'conWater2Last',
  electricityConsumption: 'conElectricity',
  electricityConsumptionLast: 'conElectricityLast',
  consumptionReadDate: 'conReadDate',
  steamConsumption: 'conSteam',
  steamConsumptionLast: 'conSteamLast',
  steamReadDate: 'conSteamReadDate',
  manualReason: 'manuelReason',
  manualReasonDateTime: 'manuelReasonDateTime',
  manualCommandActive: 'MANUELCOMMANDACTIVE',
  runningBatchDelay: 'RUNNINGBATCHDELAY',
  batchLoaded: 'BATCHLOADED',
} as const satisfies Record<string, string>

export interface MachineStatus {
  machineId: number
  updateTime: Date | null
  lastEventProcessDate: number | null
  lastEventProcessId: number | null
  lastReferenceNumber: number | null
  lastReferenceDate: Date | null
  /** Running job order number. Empty or NULL means the machine is idle. */
  runningJobOrder: string | null
  runningJobOrderStartTime: Date | null
  /** Theoretical program list for the running job order. */
  runningProgramNoList: number[] | null
  /** Foreign key to `BADATA.BATCHKEY` for the running job order. */
  runningBatchKey: number | null
  /** Job order status on the machine: `0` idle · `1` stopped · `2` running. */
  runningBatchStatus: number | null
  /** Auto/manual mode: `-1` unknown · `0` manual · `1` automatic. */
  runningAutoManStatus: AutoManualStatus | null
  runningProgramNo: number | null
  runningProgramName: string | null
  runningStepNo: number | null
  runningCommandNo: number | null
  runningCommandName: string | null
  runningAlarmNo: number | null
  runningAlarmName: string | null
  runningOperatorNo: number | null
  runningOperatorName: string | null
  /** Theoretical job order duration based on selected programs **(seconds)**. */
  runningTheoreticalTime: number | null
  runningPhaseNo: number | null
  runningPhaseName: string | null
  runningPhaseStepNo: number | null
  isCoupled: boolean | null
  requestBatchKey: number | null
  requestJobOrder: string | null
  requestRecipeIndex: number | null
  /** Request order index of the last request. If `> -1` there is an active request; read status from `requestStatus`. */
  requestOrderIndex: number | null
  requestOperationCode: number | null
  requestTargetRecipe: number | null
  requestTankNo: number | null
  requestPriority: number | null
  requestTotalCount: number | null
  requestProgramNo: number | null
  requestCommandNo: number | null
  /**
   * Status of the last dispenser request:
   * - `0` new
   * - `1` sent to dispenser
   * - `2` dispensing started
   * - `3` completed
   * - `8` cancelled
   */
  requestStatus: RequestStatus | null
  consumptionElectricityStart: number | null
  consumptionElectricityExportStart: number | null
  consumptionElectricityCapacitiveStart: number | null
  consumptionElectricityReactiveStart: number | null
  lastReceivedEventDate: number | null
  lastReceivedEventId: number | null
  lastReceivedBatchEventDate: number | null
  /** Why the machine is idle (stop reason). */
  stopReason: string | null
  stopReasonDateTime: Date | null
  /**
   * Device connection status:
   * - `0` Unknown
   * - `1` Connected
   * - `2` NotConnected
   * - `3` Pending
   * - `4` ConnectedDifferentRTC
   * - `5` BatteryLow
   */
  connectionStatus: ConnectionStatus | null
  isSynchronizing: boolean | null
  currentTemperature: number | null
  /** `0` New · `1` Confirmed · `2` Cleared / no alarm. */
  currentAlarmStatus: number | null
  /** Running job order completion ratio (percentage). */
  completionRatio: number | null
  lastPingFail: Date
  lastSoapFail: Date
  waterConsumption1: number | null
  waterConsumption2: number | null
  waterConsumption1Last: number | null
  waterConsumption2Last: number | null
  electricityConsumption: number | null
  electricityConsumptionLast: number | null
  consumptionReadDate: Date | null
  steamConsumption: number | null
  steamConsumptionLast: number | null
  steamReadDate: Date | null
  manualReason: string | null
  manualReasonDateTime: Date | null
  manualCommandActive: boolean
  runningBatchDelay: number
  lastEventCode: number | null
  batchLoaded: boolean | null
  /** Last processed event ID from Tonello machine. Used to resume polling after restart. */
  lastEventId: number | null
  /** Last processed event date string (`'yyyy-MM-dd'`). Used as the `date` param of `fetchEvents`. */
  lastEventDate: string | null
}

export type MachineStatusUpdate = Partial<Omit<MachineStatus, 'machineId' | 'updateTime'>>

// ── BACONSUMPTION ─────────────────────────────────────────────────────────────

export const BATCH_CONSUMPTION_TABLE = 'BACONSUMPTION' as const

export const BATCH_CONSUMPTION_COLUMNS = {
  consumptionKey: 'CONSUMPTIONKEY',
  machineId: 'MACHINEID',
  batchKey: 'BATCHKEY',
  flowmeter1: 'FM1VALUE',
  flowmeter2: 'FM2VALUE',
  flowmeter3: 'FM3VALUE',
  flowmeter4: 'FM4VALUE',
  flowmeter5: 'FM5VALUE',
  flowmeter6: 'FM6VALUE',
  flowmeter7: 'FM7VALUE',
  flowmeter8: 'FM8VALUE',
  flowmeter9: 'FM9VALUE',
  flowmeter10: 'FM10VALUE',
  electricity: 'ELECTRICITY',
  electricityExport: 'ELECTRICITY_EXPORT',
  electricityCapacitive: 'ELECTRICITY_CAPACITIVE',
  electricityReactive: 'ELECTRICITY_REACTIVE',
  steam: 'STEAM',
  waterType1: 'WaterType1',
  waterType2: 'WaterType2',
  waterType3: 'WaterType3',
  waterType4: 'WaterType4',
  waterType5: 'WaterType5',
  waterType6: 'WaterType6',
  waterTotal: 'WaterTotal',
  counter1: 'COUNTER1',
  counter2: 'COUNTER2',
  salt: 'SALT',
} as const satisfies Record<string, string>

export interface BatchConsumption {
  consumptionKey: number
  machineId: number
  batchKey: number
  flowmeter1: number | null
  flowmeter2: number | null
  flowmeter3: number | null
  flowmeter4: number | null
  flowmeter5: number | null
  flowmeter6: number | null
  flowmeter7: number | null
  flowmeter8: number | null
  flowmeter9: number | null
  flowmeter10: number | null
  electricity: number | null
  electricityExport: number | null
  electricityCapacitive: number | null
  electricityReactive: number | null
  steam: number | null
  waterType1: number | null
  waterType2: number | null
  waterType3: number | null
  waterType4: number | null
  waterType5: number | null
  waterType6: number | null
  waterTotal: number | null
  counter1: number
  counter2: number
  salt: number
}

export type BatchConsumptionInsert = Omit<BatchConsumption, 'consumptionKey'>
export type BatchConsumptionUpdate = Partial<
  Omit<BatchConsumption, 'consumptionKey' | 'machineId' | 'batchKey'>
>

// ── BASTOPS ───────────────────────────────────────────────────────────────────

export const BATCH_STOP_TABLE = 'BASTOPS' as const

export const BATCH_STOP_COLUMNS = {
  stopNumber: 'STOPNUMBER',
  machineId: 'MACHINEID',
  batchKey: 'BATCHKEY',
  stopReason: 'STOPREASON',
  startTime: 'STARTTIME',
  endTime: 'ENDTIME',
  explanation: 'EXPLANATION',
  archived: 'ARCHIVED',
} as const satisfies Record<string, string>

export interface BatchStop {
  stopNumber: number
  machineId: number
  batchKey: number
  stopReason: number
  startTime: Date
  endTime: Date | null
  explanation: string | null
  archived: boolean | null
}

export interface BatchStopInsert {
  machineId: number
  batchKey: number
  stopReason: number
  startTime: Date
  explanation?: string
}

// ── BABATCHPARAMETERS ─────────────────────────────────────────────────────────

export const BATCH_PARAMETER_TABLE = 'BABATCHPARAMETERS' as const

export const BATCH_PARAMETER_COLUMNS = {
  batchKey: 'BATCHKEY',
  batchParameterId: 'BATCHPARAMETERID',
  changeDate: 'CHANGEDATE',
  paramName: 'PARAMSTRING',
  value: 'VALUE',
  parameterType: 'PARAMETERTYPE',
  selectionList: 'SELECTIONLIST',
  programNo: 'PROGNO',
  programName: 'PROGNAME',
} as const satisfies Record<string, string>

export interface BatchParameter {
  batchKey: number
  batchParameterId: number
  /**
   * Date/time of the last change.
   * For values entered at job order start, equals the start time.
   * If changed during the run, holds the time of change.
   */
  changeDate: Date
  /** Parameter name (from `BFCOMMANDPARAMETERS.PARAMSTRING`). */
  paramName: string | null
  value: number | null
  parameterType: number | null
  selectionList: string | null
  /** Program number at the time of change. NULL for values entered at start. */
  programNo: number | null
  /** Program name at the time of change. NULL for values entered at start. */
  programName: string | null
}

export type BatchParameterInsert = Omit<BatchParameter, never>

// ── BFMACHINES ────────────────────────────────────────────────────────────────

export const MACHINE_TABLE = 'BFMACHINES' as const

export const MACHINE_COLUMNS = {
  machineId: 'MACHINEID',
  machineCode: 'MACHINECODE',
  groupNo: 'GRUPNO',
  tbbModel: 'TBBMODEL',
  version: 'VERSION',
  ipAddress: 'IP',
  port: 'PORT',
  inUse: 'INUSE',
  isVirtual: 'ISVIRTUAL',
  lastEventProcessDate: 'LASTEVENTPROCESSDATE',
  lastEventProcessId: 'LASTEVENTPROCESSID',
  lastJobOrder: 'LASTJOBORDER',
  lastBatchKey: 'LASTBATCHKEY',
  batchDownloadStatus: 'BATCHDOWNLOADSTATUS',
  batchNo: 'BATCHNO',
  batchDownloadStatusChangeTime: 'BATCHDOWNLOADSTATUSCHANGETIME',
  onlineActive: 'ONLINEACTIVE',
  isMaster: 'IsMaster',
  slaveMachineId: 'SlaveMachine',
  theoricElectricity: 'theoricElectricity',
  theoricWater: 'theoricWater',
  theoricSteam: 'theoricSteam',
  useInTeleskop: 'USEINTELESKOP',
  machineCapacity: 'MACHINECAPACITY',
  theoreticalCharge: 'THEORICALCHARGE',
  reelCount: 'REELCOUNT',
  nozzleCount: 'NOZZLECOUNT',
} as const satisfies Record<string, string>

export interface Machine {
  machineId: number
  machineCode: string
  groupNo: number
  tbbModel: string
  version: string | null
  ipAddress: string
  port: number
  inUse: boolean
  isVirtual: boolean
  lastEventProcessDate: Date | null
  lastEventProcessId: number | null
  lastJobOrder: string | null
  lastBatchKey: number | null
  batchDownloadStatus: number | null
  batchNo: string | null
  batchDownloadStatusChangeTime: Date | null
  onlineActive: boolean | null
  isMaster: boolean
  slaveMachineId: number
  theoricElectricity: boolean
  theoricWater: boolean
  theoricSteam: boolean
  useInTeleskop: boolean
  machineCapacity: number
  theoreticalCharge: number
  reelCount: number | null
  nozzleCount: number | null
}

export type MachineUpdate = Partial<Omit<Machine, 'machineId'>>

// ── BAIOVALUES_CURRENT ────────────────────────────────────────────────────────

export const ANALOG_IO_VALUE_TABLE = 'BAIOVALUES_CURRENT' as const

export const ANALOG_IO_VALUE_COLUMNS = {
  ioKey: 'IOKEY',
  machineId: 'MACHINEID',
  batchKey: 'BATCHKEY',
  logTime: 'LOGTIME',
  ioType: 'IOTYPE',
  ioIndex: 'IOINDEX',
  ioValue: 'IOVALUE',
  source: 'SOURCE',
} as const satisfies Record<string, string>

export interface AnalogIoValue {
  ioKey: number
  machineId: number
  batchKey: number
  logTime: Date | null
  ioType: number
  ioIndex: number
  ioValue: number
  source: string | null
}

export type AnalogIoValueInsert = Omit<AnalogIoValue, 'ioKey'>

// ── BADIOVALUES_CURRENT ───────────────────────────────────────────────────────

export const DIGITAL_IO_VALUE_TABLE = 'BADIOVALUES_CURRENT' as const

export const DIGITAL_IO_VALUE_COLUMNS = {
  ioKey: 'IOKEY',
  batchKey: 'BATCHKEY',
  logTime: 'LOGTIME',
  doFuncValues: 'DOFuncValues',
  doLockValues: 'DOLockValues',
  diValues: 'DIValues',
} as const satisfies Record<string, string>

export interface DigitalIoValue {
  ioKey: number
  batchKey: number
  logTime: Date | null
  doFuncValues: boolean[] | null
  doLockValues: boolean[] | null
  diValues: boolean[] | null
}

export interface DigitalIoValueRaw {
  ioKey: number
  batchKey: number
  logTime: Date | null
  doFuncValues: string | null
  doLockValues: string | null
  diValues: string | null
}

export type DigitalIoValueInsert = Omit<DigitalIoValue, 'ioKey'>

// ── BADATA_FILES ─────────────────────────────────────────────────────────────

export const BATCH_DATA_FILES_TABLE = 'BADATA_FILES' as const

export const BATCH_DATA_FILES_COLUMNS = {
  batchKey: 'BATCHKEY',
  fileType: 'FILETYPE',
  fileContent: 'FILECONTENT',
} as const satisfies Record<string, string>


// ── BASETPOINTCHANGES ─────────────────────────────────────────────────────────

export const SETPOINT_CHANGE_TABLE = 'BASETPOINTCHANGES' as const

export const SETPOINT_CHANGE_COLUMNS = {
  autoNumber: 'AutoNumber',
  batchKey: 'BATCHKEY',
  changeDate: 'CHANGEDATE',
  programNo: 'PROGNO',
  programIndexInBatch: 'PROGINDEXINBATCH',
  mainStep: 'MAINSTEP',
  parallelStep: 'PARALELSTEP',
  commandNo: 'COMMANDNO',
  setpointIndex: 'SPINDEX',
  oldValue: 'OLDVALUE',
  newValue: 'NEWVALUE',
  programIndex: 'PRGINDEX',
  phaseNo: 'PHASENO',
  phaseIndex: 'PHASEINDEX',
} as const satisfies Record<string, string>

export interface SetpointChange {
  autoNumber: number
  batchKey: number
  changeDate: Date
  programNo: number
  programIndexInBatch: number
  mainStep: number
  parallelStep: number
  commandNo: number
  setpointIndex: number
  oldValue: number
  newValue: number
  programIndex: number
  phaseNo: number
  phaseIndex: number
}

export type SetpointChangeInsert = Omit<SetpointChange, 'autoNumber'>

// ── BASTEPCHANGES ─────────────────────────────────────────────────────────────

export const STEP_CHANGE_TABLE = 'BASTEPCHANGES' as const

export const STEP_CHANGE_COLUMNS = {
  autoNumber: 'AutoNumber',
  batchKey: 'BATCHKEY',
  changeDate: 'CHANGEDATE',
  mainStep: 'MAINSTEP',
  parallelStep: 'PARALELSTEP',
  commandNo: 'COMMANDNO',
  stepAdded: 'STEPADDED',
} as const satisfies Record<string, string>

export interface StepChange {
  autoNumber: number
  batchKey: number
  changeDate: Date
  mainStep: number
  parallelStep: number
  commandNo: number
  stepAdded: boolean
}

export type StepChangeInsert = Omit<StepChange, 'autoNumber'>

// ── BACALCULATEDVALUES ────────────────────────────────────────────────────────

export const CALCULATED_VALUE_TABLE = 'BACALCULATEDVALUES' as const

export const CALCULATED_VALUE_COLUMNS = {
  batchKey: 'BATCHKEY',
  logTime: 'LOGTIME',
  programNo: 'PROGNO',
  valueId: 'VALUEID',
  value: 'VALUE',
  programIndex: 'PRGINDEX',
  phaseNo: 'PHASENO',
  phaseIndex: 'PHASEINDEX',
} as const satisfies Record<string, string>

export interface CalculatedValue {
  batchKey: number
  logTime: Date
  programNo: number
  valueId: number
  value: number
  programIndex: number
  phaseNo: number
  phaseIndex: number
}

export type CalculatedValueInsert = CalculatedValue

// ── DYBFBATCHPLAN ─────────────────────────────────────────────────────────────

export const BATCH_PLAN_TABLE = 'DYBFBATCHPLAN' as const

export const BATCH_PLAN_COLUMNS = {
  planKey: 'PLANKEY',
  recordTime: 'RECORDTIME',
  jobOrder: 'JOBORDER',
  machineIdList: 'MACHINEIDLIST',
  partlyPlanned: 'PARTLYPLANNED',
  plannedMachine: 'PLANNEDMACHINE',
  isCorrection: 'ISCORRECTION',
  correctionNumber: 'CORRECTIONNUMBER',
  slaveMachineId: 'SLAVEMACHINEID',
  isCoupled: 'ISCOUPLED',
  programCount: 'PRGCOUNT',
  programNoList: 'PROGRAMNOLIST',
  plannedStartTime: 'PLANNEDSTARTTIME',
  operatorCode: 'OPERATORCODE',
  clientCode: 'CLIENTCODE',
  note: 'NOTE',
  isExternal: 'ISEXTERNAL',
  isDeleted: 'ISDELETED',
  isStarted: 'ISSTARTED',
  isStopped: 'ISSTOPPED',
  startDateTime: 'STARTDATETIME',
  startedMachineId: 'STARTEDMACHINEID',
  lastForJoborder: 'lastForJoborder',
  theoreticalDuration: 'TheoricalDuration',
  color: 'Color',
  processId: 'prcssId',
  planState: 'PLANSTATE',
  dyeRatio: 'DYERATIO',
  dyeRatioWeight: 'DYERATIO_WEIGHT',
  fabricWeight: 'FABRICWEIGHT',
  partCount: 'PARTCOUNT',
  customerName: 'CUSTOMERNAME',
  partyNumber: 'PARTYNUMBER',
  batchDownloadState: 'BATCHDOWNLOADSTATE',
  theoreticalStartTime: 'THEORETICALSTARTTIME',
  orderNo: 'ORDERNO',
  style: 'STYLE',
  item: 'ITEM',
  colorName: 'COLORNAME',
} as const satisfies Record<string, string>

export interface BatchPlan {
  planKey: number
  recordTime: Date | null
  jobOrder: string
  machineIdList: number
  partlyPlanned: boolean | null
  plannedMachine: number
  isCorrection: boolean | null
  correctionNumber: number | null
  slaveMachineId: number | null
  isCoupled: boolean | null
  programCount: number
  programNoList: string | null
  plannedStartTime: Date
  operatorCode: number | null
  clientCode: number | null
  note: string | null
  isExternal: boolean | null
  isDeleted: boolean | null
  isStarted: boolean | null
  isStopped: boolean | null
  startDateTime: Date | null
  startedMachineId: number | null
  /** When multiple plan rows share the same `jobOrder`, only the latest one has this set to `true`. */
  lastForJoborder: boolean | null
  theoreticalDuration: number | null
  color: number | null
  processId: number | null
  planState: number | null
  dyeRatio: number | null
  dyeRatioWeight: number | null
  fabricWeight: number | null
  partCount: number | null
  customerName: string | null
  partyNumber: string | null
  batchDownloadState: number
  theoreticalStartTime: Date | null
  orderNo: string | null
  style: number | null
  item: number | null
  colorName: number | null
}

// ── BFMASTERPRGHEADER ─────────────────────────────────────────────────────────

export const PROGRAM_HEADER_TABLE = 'BFMASTERPRGHEADER' as const

export const PROGRAM_HEADER_COLUMNS = {
  machineId: 'MACHINEID',
  programNo: 'PROGNO',
  processCode: 'PROCESSCODE',
  name: 'NAME',
  duration: 'DURATION',
  totalStep: 'TOTALSTEP',
  changeDate: 'CHANGEDATE',
  creationDate: 'CREATIONDATE',
  userComment: 'USERCOMMENT',
  isDeleted: 'ISDELETED',
  isChanged: 'ISCHANGED',
  programState: 'PRGSTATE',
  sourceMachineId: 'SOURCEMACHID',
  totalChemReq: 'TotalChemReq',
  totalDyeReq: 'TotalDyeReq',
  manChemReq: 'ManChemReq',
  autoChemReq: 'AutoChemReq',
  autoDyeReq: 'AutoDyeReq',
  manDyeReq: 'ManDyeReq',
  defaultRecipeNo: 'DefaultRecipeNo',
  phaseVersion: 'PHASEVERSION',
  interventionFreeProgram: 'INTERVENTIONFREEPROGRAM',
  additionalProcessCode: 'ADDITIONALPROCESSCODE',
} as const satisfies Record<string, string>

export interface ProgramHeader {
  machineId: number
  programNo: number
  processCode: number
  name: string
  /** Theoretical duration **(seconds)**. */
  duration: number
  totalStep: number
  changeDate: Date
  creationDate: Date
  userComment: string | null
  isDeleted: boolean
  isChanged: boolean
  programState: number | null
  sourceMachineId: number | null
  totalChemReq: number
  totalDyeReq: number
  manChemReq: number
  autoChemReq: number
  autoDyeReq: number
  manDyeReq: number
  defaultRecipeNo: number | null
  phaseVersion: number
  interventionFreeProgram: boolean | null
  additionalProcessCode: number | null
}

// ── BACHEMICALREQUESTSTRINGS ──────────────────────────────────────────────────

export const CHEMICAL_REQUEST_STRING_TABLE = 'BACHEMICALREQUESTSTRINGS' as const

export const CHEMICAL_REQUEST_STRING_COLUMNS = {
  id: 'ID',
  request: 'REQUEST',
  batchKey: 'BATCHKEY',
  requestTime: 'REQUESTTIME',
  isRequest: 'ISREQUEST',
} as const satisfies Record<string, string>

export interface ChemicalRequestString {
  id: number
  /** The request or response payload string. */
  request: string | null
  batchKey: number | null
  requestTime: Date | null
  /**
   * `true`  → this row is a request sent to the external app.
   * `false` → this row is a response from the external app for the same `batchKey`.
   */
  isRequest: boolean
}

export interface ChemicalRequestStringParsed {
  requestType: RequestType
  priority: number
  machineNo: number
  tankNo: number
  jobOrder: string
  programNo: number
  requestOrderInBatch: number
  requestOrderInProgram: number
  totalRequestsInProgram: number
  materialType: MaterialType
  programIndex: number
}

/**
 * Parsed form of a response row written by Dispensing Manager (`isRequest = false`).
 * The REQUEST string has the same field order as a request, except the first field
 * is the `RequestStatus` value instead of `requestType`.
 */
export interface ChemicalRequestStringResponseParsed {
  status: RequestStatus
  priority: number
  machineNo: number
  tankNo: number
  jobOrder: string
  programNo: number
  requestOrderInBatch: number
  requestOrderInProgram: number
  totalRequestsInProgram: number
  materialType: MaterialType
  programIndex: number
}

export type ChemicalRequestStringInsert = Omit<ChemicalRequestString, 'id' | 'request'> &
  ChemicalRequestStringParsed

// ── BACHEMICALREQUEST ─────────────────────────────────────────────────────────

export const CHEMICAL_REQUEST_TABLE = 'BACHEMICALREQUEST' as const

export const CHEMICAL_REQUEST_COLUMNS = {
  id: 'AUTOID',
  batchKey: 'BATCHKEY',
  requestTime: 'REQUESTTIME',
  jobOrder: 'JobOrder',
  recipeIndex: 'RECEIPEINDEX',
  requestOrderIndex: 'RequestOrderIndex',
  operationCode: 'OPERATIONCode',
  targetRecipe: 'TargetRECIPE',
  tankNo: 'TankNo',
  priority: 'PRIORITY',
  totalRequestsInProgram: 'TotalNumberOfRequest',
  programNo: 'ProgramNo',
  commandNo: 'COMMANDNO',
  status: 'STATUS',
  tonelloEvent: 'TonelloEvent',
} as const satisfies Record<string, string>

export interface ChemicalRequest {
  id: number
  batchKey: number
  requestTime: Date
  jobOrder: string
  recipeIndex: number
  requestOrderIndex: number
  operationCode: number
  targetRecipe: number
  tankNo: number
  priority: number
  totalRequestsInProgram: number
  programNo: number
  commandNo: number
  status: RequestStatus | null
  tonelloEvent: TonelloChemicalRequestEvent | null
}

export interface ChemicalRequestInsert {
  batchKey: number
  requestTime: Date
  jobOrder: string
  recipeIndex: number
  requestOrderIndex: number
  operationCode: number
  targetRecipe: number
  tankNo: number
  priority: number
  totalRequestsInProgram: number
  programNo: number
  commandNo: number
  status?: RequestStatus
  tonelloEvent?: TonelloChemicalRequestEvent | null
}

// ── BFMASTERCOMMANDS ──────────────────────────────────────────────────────────

export const COMMAND_TABLE = 'BFMASTERCOMMANDS' as const

export const COMMAND_COLUMNS = {
  machineId: 'MACHINEID',
  commandNo: 'COMMANDNO',
  functionId: 'FUNCTIONID',
  tbbFunctionName: 'TBBFUNTIONNAME',
  name: 'NAME',
  activated: 'ACTIVATED',
  isRunManual: 'ISRUNMANUAL',
  commandType: 'COMMANDTYPE',
  moveParallel: 'MOVEPARALLEL',
  changeTime: 'CHANGETIME',
  isDeleted: 'ISDELETED',
  isChanged: 'ISCHANGED',
  isTemperature: 'ISTEMPERATURE',
  isUnload: 'ISUNLOAD',
  icon: 'ICON',
  groupId: 'GROUPID',
} as const satisfies Record<string, string>

export interface Command {
  machineId: number
  commandNo: number
  functionId: number | null
  tbbFunctionName: string
  name: string
  activated: boolean
  isRunManual: boolean
  commandType: number
  moveParallel: number
  changeTime: Date | null
  isDeleted: boolean
  isChanged: boolean
  isTemperature: boolean | null
  isUnload: boolean | null
  icon: string | null
  groupId: number | null
}

// ── BASTARTEND ────────────────────────────────────────────────────────────────

export const BATCH_START_END_TABLE = 'BASTARTEND' as const

export const BATCH_START_END_COLUMNS = {
  id: 'AUTOID',
  jobOrder: 'JOBORDER',
  machineId: 'MACHINEID',
  state: 'STATE',
  date: 'DATE',
  programNoList: 'PROGRAMNOLIST',
  totalRequestCount: 'TOTALREQUESTCOUNT',
} as const satisfies Record<string, string>

export interface BatchStartEnd {
  id: number
  jobOrder: string
  machineId: number
  /** `0` = Start · `1` = End */
  state: BatchStartEndState
  date: Date
  /** Program numbers (e.g. `[1101, 2502]`). */
  programNoList: number[]
  totalRequestCount: number
}

export interface BatchStartEndInsert {
  jobOrder: string
  machineId: number
  state: BatchStartEndState
  date: Date
  /** Accepts a number array — serialised to CSV on insert. */
  programNoList: number[]
  totalRequestCount: number
}
