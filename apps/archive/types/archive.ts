import type { DDate, NullableDDate } from './utils'

export interface Batch {
  active: boolean
  lastRecordDate: Date
  machine: Machine
  joborderInfo: BatchInfo
  batchParameters: BatchParameters[]
  interventions: BatchIntervention[]
  alarms: BatchAlarm[]
  actualCommands: BatchCommand[]
  mergedCommands: MergedBatchCommand[]
  theoreticalPrograms: Program[]
  analogInputs: AnalogInputOutputType[]
  analogOutputs: AnalogInputOutputType[]
  digitalInputs: DigitalInputOutputType[]
  digitalOutputs: DigitalInputOutputType[]
  digitalOutputLocks: DigitalInputOutputType[]
  counters: Counter[]
  cycleTimes: Reel[]
  virtualInputs: VirtualInput[]
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
  startTime: string
  endTime: string
}
export interface IOSetting {
  color: string
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
  type: 'NUMBER' | 'SELECT' | 'MACHINE_FORMULA' | 'SELECTABLE_FORMULA'
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
  cycles: { count: number, duration: number, cycledAt: DDate }[]
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
  joborder: string
  startTime: string
  endTime: string | null
  programCount: number
  operatorCode: number
  operatorName: string
  theoreticalDuration: number
  actualTheoreticalDuration: number
  actualDuration: number | null
  deviation: number | null
  isCancelled: boolean
}

export interface BatchIntervention {
  eventId: number
  time: Date
  parameters: string[]
  explanation: string[]
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
  programIndex: number
  stepNo: number
  parallelStepNo: number
  commandNo: number
  startTime: DDate
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
  stepStatus: string
  isFinished: boolean
  commandName?: string
  icon?: string
}

export interface ArchivedIoValues {
  analogValues: ArchivedAnalogValue[]
  digitalValues: ArchivedDigitalValue[]
  cycleTimes: ArchivedReelCycleTime[]
  virtualInputValues: ArchivedVirtualInputValue[]
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

export interface ArchivedReelCycleTime {
  reelNo: number
  cycleCount: number
  /** Cycle duration. */
  cycleTime: number
  cycleDate: DDate
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
