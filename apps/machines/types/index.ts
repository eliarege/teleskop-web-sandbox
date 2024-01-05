export interface Machine {
  machineId?: number
  machineCode?: string
  groupName?: string
  groupId?: number
  tbbModel?: string
  plcModel?: string
  ip?: string
  theoricalCharge?: string
  theoricalChargeDuration?: string
  machineCapacity?: string
  reelCount?: number
  nozzleCount?: number
  steamUnit?: string
  steamKgPerHour?: number
  additionalTank1?: boolean
  additionalTank2?: boolean
  additionalTank3?: boolean
  additionalTank4?: boolean
  reserveTank?: boolean
  inUse?: boolean
  MTTempIo?: string[]
  version?: string
  productModel?: string
  hardwareModel?: string
}

export interface User {
  userId: number
  userName: string
  userSurname: string
  userPass: string
  userInfo?: string
  userActive?: number
  userMode: string
  userMode2: string
  userType: number
}

export interface StopReason {
  stopCode: number
  stopName: string
  reportToERP?: boolean
}

export interface ManualReason {
  manualId: number
  manualReason: string
  reportToERP?: boolean
}

export interface FinishReason {
  reasonId: string
  typeId: number
  text: string
  reportToERP?: number
}

export interface StepReason {
  id: number
  reasonText: string
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
  machineParameterId?: number
  paramString?: string
  defaultValue?: number
  dmArea?: number
  consScreen?: number
  paramLowLimit?: number
  paramHighLimit?: number
  consFormat?: number
  paramNo?: number
  consUnit?: number
  currentValue?: number
  parameterType?: number
  selectionList?: string
  unitCode?: number
  selectionValues?: string
  isDeleted?: number
}

export interface IO {
  id: number
  card: number
  channel: number
  name: string
  enabled: number
}

export interface IOOutput extends IO {
  defaultValue: number
}

export interface MasterCommandsAlarm {
  commandNo: number
  alarmNo: number
  alarm: string
}

export interface FeedbackCommand {
  commandNo: number
  PVNo: number
  returnValueName: number
  canShow: number
  SPRelation: number
}

export interface MasterCommand {
  commandNo?: number
  commandType?: number
  x?: string
  y?: string
  a?: string
  maxA?: string
  b?: string
  adviceList?: string
  dontUseList?: string
  functionId?: number
  tbbFunctionName?: string
  name?: string
  activated?: number
  isRunManual?: number
  moveParallel?: number
  changeTime?: Date
  tbbChangeTime?: Date
  isDeleted?: number
  isChanged?: number
  isTemperature?: number
  isUnload?: number
  icon?: string
  groupId?: number
  type?: number
}

export interface CommandGroup {
  commandGroupId: number
  name: string
  icon: string
}

export interface FunctionAlarm {
  f: string
  s: string
  e: string
  o: string
  m: string
}

export interface ErpParameter {
  paramId: number
  paramName: string
  paramType: number
  erpFieldName: string
  batchReportVisible: number
  batchReportOrder: number
  partyNoParam: number
}
