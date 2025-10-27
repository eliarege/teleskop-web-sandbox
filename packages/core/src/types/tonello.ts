export type TonelloLocale =
  | 'ENU'
  | 'ITA'
  | string & NonNullable<unknown>

export type TonelloResponse<T = unknown, DataKey extends string = 'data'> = {
  result: TonelloResponseResult
} & (T extends null ? Record<string, never> : { [K in DataKey]: T })

export type TonelloResponseWithoutWrapper<T extends Record<string, any>> = T & {
  result: TonelloResponseResult
}

export interface TonelloResponseResult {
  status: string
  code: number
  message: string
}

export interface TonelloEventList {
  from: number
  to: number
  events: TonelloEvent[]
}

export interface TonelloEvent {
  id: number
  /** Event type, personally it should be named `type` */
  eventValue: number
  datetime: string
  params: Record<string, unknown>
}

export interface TonelloMachineStatus {
  activeFunctions: string
  lifeminutes: number
  stepType: number
  activeRequests: string
  pcVersion: string
  mxCurTemp2: number
  plcVersion: string
  warnings1: number
  nextBatchReady: string
  endOfProgram: string
  programName: string
  conductivity: number
  oscillation: number
  curRpm: number
  curoperator: string
  alarms: number
  o3alarms: number
  curVol: number
  step: number
  autoMode: string
  lot: string
  kgs: number
  curTemp: number
  steps: number
  programTime: number
  mxCurVol1: number
  mxCurVol2: number
  setTemp: number
  mxCurTemp1: number
  setRpm: number
  setVol: number
  programRunning: string
  warnings2: number
  functions: number
  pH: number
}

export interface TonelloBatch {
  code: string
  name: string
  description: string
  params: { name: string, value: unknown }[]
  programsCount: number
  programs: {
    program: TonelloProgram
  }[]
}

export interface TonelloProgramList {
  programsCount: number
  programs: TonelloProgramHeader[]
}

export interface TonelloProgramHeader {
  code: number
  name: string
}

export interface TonelloProgram {
  /** TODO: Tell tonello to make this number */
  code: number
  name: string
  description: string
  type: 'program' | 'macro'
  params: unknown[]
  stepsCount: number
  steps: TonelloProgramStep[]
}

export interface TonelloProgramStep {
  /** Step Index */
  step: number
  /** Function Index, commandNo equivalent */
  index: number
  version: number
  params: {
    /** Values of `bit` typed parameters. */
    bits: (0 | 1)[]
    /** Values of other parameters. */
    values: number[]
  }
}

export interface TonelloInputOutputValues {
  digitalInputs: TDigitalValue[]
  digitalOutputs: TDigitalValue[]
  analogInputs: TAnalogValue[]
  analogOutputs: TAnalogValue[]
}

export interface TonelloInputOutputList {
  digitalsInputs: TonelloDigital[]
  digitalsOutputs: TonelloDigital[]
  analogInputs: TonelloAnalog[]
  analogOutputs: TonelloAnalog[]
  counters: TonelloAnalog[]
}

export interface TonelloAnalog {
  /** code value between TAnalog and TAnalogValue should be similar */
  code: string
  /** Unrequired field if only provided via InputOutputList */
  type: string
  unit: string
  label: string
}

export interface TonelloDigital {
  code: string
  type: string
  label: string
}

export type TAnalogValue = {
  code: string
  value: number
} | null

export type TDigitalValue = {
  code: string
  value: boolean
} | null

export interface TonelloAlarm {
  code: number
  type: TAlarmType
  /** Localized label */
  label: string
}

export interface TonelloFunction {
  /** Function index */
  index: number | null
  /** Can earlier versions be accesed? */
  // version: number
  label: string
  /** What is position, is it used for anything? */
  // position: string
  /** Can images be accessed / should images be accessed? */
  img: string
  icon: string
  /** Is visible and position UI related properties? */
  visible: boolean
  params: TFunctionParameter[]
}

export interface TonelloFunctionParameterAny {
  type: 'bit' | 'list' | 'value' | 'additive'
  row: number
  index: number
  /** Localized parameter label */
  label: string
  default?: number
  options?: {
    value: number
    label: string
  }[]
  min?: string
  max?: string
  decimals?: string
  hidezero?: boolean
  section?: string
  offset?: string
}

export type TFunctionParameter =
  | TonelloFunctionParameterBit
  | TonelloFunctionParameterList
  | TonelloFunctionParameterValue
  | TonelloFunctionParameterAdditive

export interface TonelloFunctionParameterBit extends TonelloFunctionParameterBase {
  type: 'bit'
  /** TODO: Default could be `false` or `true` */
  default?: 0 | 1
}

export interface TonelloFunctionParameterList extends TonelloFunctionParameterBase {
  type: 'list'
  default?: number
  options: {
    value: number
    /** Localized label */
    label: string
  }[]
}

export interface TonelloFunctionParameterValue extends TonelloFunctionParameterBase {
  type: 'value'
  default?: number
  min: number | string
  max: number | string
  decimals?: number
  hidezero: boolean
}

/** What are additives? */
export interface TonelloFunctionParameterAdditive extends TonelloFunctionParameterBase {
  type: 'additive'
  /** TODO: Meaning? */
  section: string
  min: string
  max: string
  /** Offset in this context? */
  offset: string
  options: {
    value: number
    label: string
  }[]
}

interface TonelloFunctionParameterBase {
  row: number
  /** Could be number. Is index the index of the this parameter in the `values` array. */
  index: number
  label: string
}

export interface TonelloDateTime {
  date: string
  time: string
}

export type TAlarmType = 'alarm' | 'ozoneWarning' | 'warning' | 'timeoutWarning'

export interface TonelloConfiguration {
  pages: {
    /** Page number */
    page: number
    /** Localized page label */
    label: string
    params: TonelloMachineParameter[]
  }[]
}

export type TonelloMachineParameter =
  | TonelloMachineParameterValue
  | TonelloMachineParameterList
  | TonelloMachineParameterBit

export interface TonelloMachineParameterBase {
  index: number
  /** Localized parameter label */
  label: string
  local: boolean
}

export interface TonelloMachineParameterValue extends TonelloFunctionParameterBase {
  type: 'value'
  /** How many decimals in `value` */
  decimals: number
  value: number
}

export interface TonelloMachineParameterList extends TonelloFunctionParameterBase {
  type: 'list'
  /** Comma separated list of options */
  options: string
  /** Index of selected option */
  value: number
}

export interface TonelloMachineParameterBit extends TonelloFunctionParameterBase {
  type: 'bit'
  value: boolean
}

export interface TonelloMachineStatus {
  activeFunctions: string
  lifeminutes: number
  stepType: number
  activeRequests: string
  pcVersion: string
  mxCurTemp2: number
  plcVersion: string
  warnings1: number
  nextBatchReady: string
  endOfProgram: string
  programName: string
  conductivity: number
  oscillation: number
  curRpm: number
  curoperator: string
  alarms: number
  o3alarms: number
  curVol: number
  step: number
  autoMode: string
  lot: string
  kgs: number
  curTemp: number
  steps: number
  programTime: number
  mxCurVol1: number
  mxCurVol2: number
  setTemp: number
  mxCurTemp1: number
  setRpm: number
  setVol: number
  programRunning: string
  warnings2: number
  functions: number
  pH: number
}
