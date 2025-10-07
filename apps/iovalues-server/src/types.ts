export interface AnalogValue {
  logtime: string
  ioType: number
  ioIndex: number
  ioValue: number
}

export interface DigitalValue {
  logtime: string
  DOF: string
  DOL: string
  DI: string
}

export interface ReelCycleTime {
  reelNo: number
  cycleCount: number
  cycleTime: number
  cycleDate: string
  commandNo: number
}

export interface CalculatedValue {
  logtime: string
  progNo: number
  valueId: number
  value: number
}

export interface VirtualInputValue {
  logtime: string
  ioId: number
  ioValue: number
}

export interface BatchArchivePaths {
  analogValuesPath: string
  digitalValuesPath: string
  calculatedValuesPath: string
  virtualInputValuesPath: string
  cycleTimesPath: string
}
export interface BatchArchiveValues extends Batch {
  analogValues: AnalogValue[]
  digitalValues: DigitalValue[]
  calculatedValues: CalculatedValue[]
  virtualInputValues: VirtualInputValue[]
  cycleTimes: ReelCycleTime[]
}

export interface Batch {
  batchKey: number
  machineId: number
  startTime: string
}
