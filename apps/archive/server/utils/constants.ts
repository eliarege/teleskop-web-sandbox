export const maxIOSize = 128

export const IOType = {
  AnalogInput: 1,
  AnalogOutput: 2,
  DigitalInput: 3,
  DigitalOutput: 4,
  Counter: 5,
} as const

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
