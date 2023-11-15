export interface Machine {
  id: number
  code: string
  groupName: string
  groupId: number
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
  MTTempIo: string[]
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

export interface RecipeType {
  id: number
  typeName: string
}
export interface WaterType {
  waterTypeId: number
  waterTypeName: string
}

export interface CommandAlarmReason {
  id: number
  reasonText: string
  commandNumbers: number[]
  groupId: number
}

export interface MachineParameter {
  id: number
  paramString: string
  defaultValue: number
  dmArea: number
  consScreen: number
  paramLowLimit: number
  paramHighLimit: number
  consFormat: number
  paramNo: number
  consUnit: number
  currentValue: number
  parameterType: number
  selectionList: string
  unitCode: number
  selectionValues: string
  isDeleted: number
}

export interface AnalogInput {
  id: number
  card: number
  canal: number
  name: string
  enabled: number
}
