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
  userMode: string
  userMode2: string
  userType: string | number
}

export interface MachineStopReason {
  stopCode: string
  stopName: string
  reportToERP: boolean
}

export interface ManualReason {
  manualId: string
  manualReason: string
  reportToERP: boolean
}

export interface FinishReason {
  reasonId: string
  typeId: string | number
  text: string
  reportToERP: boolean
}

export interface LockGeneral {
  machineId: number
  lockNo: number
  lockName: string
  logicType: number
  stopDyeing: number
  jumpStep: number
  alarm: number
  onDelay: string
  stepDelay: string
  giveMessage: number
  messageString: string
  aInLogicType: number
  dInLogicType: number
  commandLogicType: number
  lockLogicType: number
  dOutLogicType: number
  vInLogicType: number
}
