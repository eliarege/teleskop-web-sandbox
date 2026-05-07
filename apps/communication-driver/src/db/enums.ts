export const BatchStatus = {
  Idle: 0,
  Paused: 1,
  Running: 2,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type BatchStatus = (typeof BatchStatus)[keyof typeof BatchStatus]

export const ConnectionStatus = {
  Unknown: 0,
  Connected: 1,
  NotConnected: 2,
  Pending: 3,
  ConnectedDifferentRTC: 4,
  BatteryLow: 5,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus]

export const MaterialType = {
  Chemical: 0,
  Dye: 1,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type MaterialType = (typeof MaterialType)[keyof typeof MaterialType]

export const RequestType = {
  RequestWithMaterialCode: 1,
  RequestWithRecipeStep: 2,
  ChangePriority: 4,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type RequestType = (typeof RequestType)[keyof typeof RequestType]

export const RequestStatus = {
  New: 0,
  TransferredToDispenser: 1,
  Started: 2,
  Completed: 3,
  Cancelled: 8,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus]

export const BinaryFileType = {
  bftAnalogIo: 0,
  bftCycleTimes: 1,
  bftCycleTimesV2: 2,
  bftDigitalIoValuesV2: 3,
  bftCalculatedValues: 4,
  bftVirtualInput: 5,
  // For tonello
  AnalogIO_JSON: 6,
  DigitalIO_JSON: 7,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type BinaryFileType = (typeof BinaryFileType)[keyof typeof BinaryFileType]

export const BatchStartEndState = {
  Start: 0,
  End: 1,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type BatchStartEndState = (typeof BatchStartEndState)[keyof typeof BatchStartEndState]

export const IoType = {
  AnalogInput: 1,
  AnalogOutput: 2,
  DigitalInput: 3,
  DigitalOutput: 4,
  Counter: 5,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type IoType = (typeof IoType)[keyof typeof IoType]

export const CancelDetail = {
  IncludeInProduction: 1,
  ExcludeFromProduction: 2,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type CancelDetail = (typeof CancelDetail)[keyof typeof CancelDetail]
