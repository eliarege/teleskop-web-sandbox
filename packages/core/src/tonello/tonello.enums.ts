export const TonelloEventCode = {
  ChemicalRequestEvent: 1,
  BatchStartEvent: 7,
  BatchEndEvent: 8,
  BatchStoppedEvent: 9,
  BatchContinueEvent: 11,
  BatchCancelledEvent: 10,
  CommandStartEvent: 19,
  CommandFinishEvent: 20,
  IoValueChangedEvent: 59,
  // TODO: Check actual values for these events
  AlarmCreatedEvent: -100,
  AlarmClearedEvent: -101,
  AlarmConfirmedEvent: -102,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type TonelloEventCode = typeof TonelloEventCode[keyof typeof TonelloEventCode]

export const TonelloIoType = {
  AnalogInput: '1',
  AnalogOutput: '2',
  DigitalInput: '3',
  DigitalOutput: '4',
  Counter: '5',
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type TonelloIoType = typeof TonelloIoType[keyof typeof TonelloIoType]

export const TonelloChemicalRequestStatus = {
  Received: 1,
  Working: 2,
  Done: 3,
  Error: 4,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type TonelloChemicalRequestStatus = typeof TonelloChemicalRequestStatus[keyof typeof TonelloChemicalRequestStatus]

export const TonelloChemicalRequestType = {
  Chemical: 0,
  Dye: 1,
  Salt: 2,
  Other: 3,
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type TonelloChemicalRequestType = typeof TonelloChemicalRequestType[keyof typeof TonelloChemicalRequestType]


export const TonelloAutoMode = {
  False: '0',
  True: '1',
} as const

/* eslint-disable-next-line ts/no-redeclare */
export type TonelloAutoMode = typeof TonelloAutoMode[keyof typeof TonelloAutoMode]
