export interface Machine {
  id: boolean
  code: string
  groupName: string
  tbbModel: string
  plcModel: string
  ip: string
  theoricalCharge: string
  theoricalChargeDuration: string
  machineCapacity: string
  reelCount: number
  nozzleCount: number
  steamUnit: string
  steamKgPerHour: number
  additionalTank1: boolean
  additionalTank2: boolean
  additionalTank3: boolean
  additionalTank4: boolean
  reserveTank: boolean
  inUse: boolean
  MTTempIo: Array<string>
  version: string
}

export interface User {
  userId: string
  userName: string
  userSurname: string
  userPass: string
  userInfo: string
  userActive: boolean
  userType: string | number
}

export interface MachineStopReason {
  stopName: string
  reportToERP: boolean
}

export interface ManualReason {
  manualReason: string
  reportToERP: boolean
}
