import type { ParameterType } from '../utils/formula'
import type { DDate, NullableDDate } from './utils'
import type { StepStatusType } from '~/shared/constants'

export interface Batch {
  batchKey: number
  active: boolean
  lastRecordDate: Date
  machine: Machine
  jobOrderInfo: BatchInfo
  batchParameters: BatchParameters[]
  interventions: BatchIntervention[]
  alarms: BatchAlarm[]
  actualCommands: BatchCommand[]
  mergedCommands: MergedBatchCommand[]
  theoreticalPrograms: Program[]
  theoreticalProgramWarnings?: { programNo: number, changeDate: string }[]
  notFoundPrograms?: number[]
  analogInputs: AnalogInputOutputType[]
  analogOutputs: AnalogInputOutputType[]
  digitalInputs: DigitalInputOutputType[]
  digitalOutputs: DigitalInputOutputType[]
  digitalOutputLocks: DigitalInputOutputType[]
  counters: Counter[]
  cycleTimes: Reel[]
  virtualInputs: VirtualInput[]
  calculatedValues: CalculatedValue[]
}

export interface BatchValues extends ArchivedIoValues {
  active: boolean
  lastRecordDate: Date
  alarms: BatchAlarm[]
  actualCommands: BatchCommand[]
  mergedCommands: MergedBatchCommand[]
  interventions: BatchIntervention[]
}

export interface BasicProgram {
  programNo: number
  programName?: string
  processType?: string
  startTime: string
  endTime: string
}

export type LineType = 'default' | 'dashed' | 'dotted'
export interface IOSetting {
  color: string
  lineType?: LineType
  selected: boolean
  axis: string
}
export interface Axis {
  name: string
  isDefault?: boolean
  visible: boolean
  color: string
  unit: string
  max: number
  min?: number
  ioKeys: Array<string>
}

// #region Machine
export interface Machine {
  id: number
  name: string
  capacity: number
  theoreticalCharge: number
  model: string
  constants: MachineConstant[]
  batchParameters: MachineBatchParameter[]
  commandFormulas: MachineCommandFormula[]
  commands: MachineCommand[]
}
export interface BatchParameters {
  id: number
  name: string
  paramValues: {
    time: string
    value: number
  }[]

}

export interface MachineConstant {
  name: string
  value: number
}

export interface MachineBatchParameter {
  id: number
  name: string
  defaultValue: number | null
}

export interface MachineCommandFormula {
  id: number
  formula: string
}

export interface MachineCommand {
  commandNo: number
  name: string
  commandType: number
  x: string
  y: string
  a: string
  icon: string
  maxA: string
  b: string
  isTemperature: boolean
  isUnload: boolean
  parameters: MachineCommandParameter[]
  ioList: MachineCommandIO[]
}

export interface MachineCommandParameter {
  index: number
  name: string
  type: typeof ParameterType[keyof typeof ParameterType]
  format: 'NONE' | 'TEMPERATURE' | 'DURATION'
  value: string
  containsVariable: boolean
  useDefault: boolean
  useFormula: boolean
  selections: { name: string, value: number }[]
}

export interface MachineCommandIO {
  index: number
  physicalId: number
  type: number
  selectable: boolean
  name: string
  selections: {
    index: number
    type: number
    name: string
    defaultValue: boolean
    physicalId: number
  }[]
}
// #endregion

// #region Input/Output
export interface AnalogValue {
  time: DDate
  value: number
}

export interface DigitalValue {
  time: DDate
  value: number
}

export interface AnalogInputOutputType {
  ioIndex: number
  name: string
  enabled: boolean
  /** Type sıfır ise sıcaklık girişidir. */
  calibType: 0 | 1
  calibMaxValue: number
  calibUnit: string
  ioValues: AnalogValue[]
}

export interface DigitalInputOutputType {
  ioIndex: number
  name: string
  enabled: boolean
  ioValues: DigitalValue[]
}

export interface Counter {
  ioIndex: number
  name: string
  enabled: boolean
  calibUnit: string
  ioValues: AnalogValue[]
}

export interface VirtualInput {
  ioIndex: number
  name: string
  enabled: boolean
  buttonType: number
  ioValues: AnalogValue[]
}

export interface Reel {
  reelNo: number
  cycles: { count: number, duration: number, cycledAt: Date }[]
}

export interface CalculatedValue {
  ioIndex: number
  name: string
  ioValues: CalculatedValueValue[]
}
export interface CalculatedValueValue {
  time: DDate
  valueId: number
  value: number
}

// #endregion

// #region Program
export interface Program {
  name: string
  duration: number
  programNo: number
  steps: ProgramStep[]
}
export interface TheoreticalProgram {
  programNo: number
  programName: string
  startTime: Date
  endTime: Date
  duration: number
  ioValues: {
    time: Date | string
    value: number
    programNo: number
    commandNo: number
    isUnload?: boolean
  }[]
}
export interface ProgramStep {
  mainCommand: ProgramStepCommand
  parallelCommands: ProgramStepCommand[]
}

export interface ProgramStepCommand {
  commandNo: number
  parameters: {
    index: number
    value: number
  }[]
  ioList: {
    ioId: number
    ioIndex: number
    value: [number, number][]
  }[]
}
// #endregion Program

export interface BatchInfo {
  batchKey: number
  machineId: number
  machineName: string
  machineModel: string
  jobOrder: string
  startTime: string
  endTime: string | null
  cancelTime: string | null
  programCount: number
  operatorCode: number
  operatorName: string
  theoreticalDuration: number
  actualTheoreticalDuration: number
  actualDuration: number | null
  deviation: number | null
  isCancelled: boolean
  partyNumber: string
}

export interface BatchIntervention {
  eventId: number
  time: Date
  parameters: string[]
  explanation: string[]
  operator: string
}

export interface BatchAlarm {
  batchAlarmNo: number
  alarmNo: number
  programNo: number
  commandNo: number
  /** ISO Formatted Date String */
  startTime: string
  /** ISO Formatted Date String */
  endTime: string
  explanation: string
  alarmType: number
  isParallel: boolean
}

export interface BatchStep {
  [x: string]: any
  programNo: number
  stepNo: number
  startTime: string
  endTime: string
  mainCommand: {
    index: number
    commandNo: number
  }
  parallelCommands: {
    index: number
    commandNo: number
  }[]
}

export interface ERPParameter {
  parameterId: number
  parameterName: string
  value: number
  unit?: string
}

export interface BatchCommand {
  programNo: number
  programName?: string
  processType?: string
  programIndex: number
  stepNo: number
  parallelStepNo: number
  commandNo: number
  startTime: Date
  endTime: NullableDDate
}

export interface MergedBatchCommand {
  theoreticalStepNo: number
  actualStepNo: number
  programNo: number
  commandNo: number
  startTime: string
  endTime: string
  theoreticalDuration: number
  stepStatus: StepStatusType
  isFinished: boolean
  commandName?: string
  icon?: string
}

export interface ArchivedIoValues {
  analogValues: ArchivedAnalogValue[]
  digitalValues: ArchivedDigitalValue[]
  cycleTimes: ArchivedReelCycleTime[]
  virtualInputValues: ArchivedVirtualInputValue[]
  calculatedValues: ArchivedCalculatedValue[]
}

export interface ArchivedAnalogValue {
  logtime: DDate
  ioType: number
  ioIndex: number
  ioValue: number
}

export interface ArchivedDigitalValue {
  logtime: DDate
  DI: string
  DOF: string
  DOL: string
}

export interface ArchivedVirtualInputValue {
  logtime: DDate
  ioId: number
  ioValue: number
}

export interface ArchivedCalculatedValue {
  logtime: DDate
  progNo: number
  valueId: number
  value: number
}

export interface ArchivedReelCycleTime {
  reelNo: number
  cycleCount: number
  /** Cycle duration. */
  cycleTime: number
  cycleDate: DDate
}

export type ConsumptionKey =
  | 'waterType1'
  | 'waterType2'
  | 'waterType3'
  | 'waterType4'
  | 'waterType5'
  | 'waterType6'
  | 'waterTotal'
  | 'electricity'
  | 'steam'
  | 'steamPerWeight'
  | 'electricityPerWeight'
  | 'totalWaterPerWeight'

export type Consumptions = {
  [key in ConsumptionKey]: number
}

export type ConsumptionUnits = {
  [key in ConsumptionKey]: string
}

export interface TaskStatus {
  currentStep: number
  message?: string
  maxSteps: number
  state: 'active' | 'completed' | 'cancelled' | 'failed'
}
export interface TaskConfig {
  maxSteps: number
  handler: (step: TaskStepContext) => any
}

export interface TaskStepContext {
  next: (ctx: { message: string }) => void
  isCancelled: () => boolean
}

export type TaskResponse<T> =
  | { status: 'success', data: T }
  | { status: 'error', error: { message: string, data: any | null } }

export interface ERPParameterDefinition {
  paramId: number
  paramName: string
  batchReportVisible: boolean
}

export interface RecipeStep {
  jobOrder: string
  recipeType: string
  processOrder: number
  ISN: string
  mainStep: number
  parallelStep: number
  chemCode: string
  materialName: string
  programProcessNo: string
  amount: number
  unit: string
  programNo: string
  recipeAmount: number
}
