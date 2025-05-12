export interface ArchivedIoValues {
  /** We ignore this field */
  startTime: string
  analogValues: ArchivedAnalogValue[]
  digitalValues: ArchivedDigitalValue[]
  cycleTimes: ArchivedReelCycleTime[]
  virtualInputValues: ArchivedVirtualInputValue[]
  calculatedValues: ArchivedCalculatedValue[]
}

export interface ArchivedAnalogValue {
  logtime: string
  ioType: number
  ioIndex: number
  ioValue: number
}

export interface ArchivedDigitalValue {
  logtime: string
  DI: string
  DOF: string
  DOL: string
}

export interface ArchivedVirtualInputValue {
  logtime: string
  ioId: number
  ioValue: number
}

export interface ArchivedCalculatedValue {
  logtime: string
  progNo: number
  valueId: number
  value: number
}

export interface ArchivedReelCycleTime {
  reelNo: number
  cycleCount: number
  /** Cycle duration. */
  cycleTime: number
  cycleDate: string
}
