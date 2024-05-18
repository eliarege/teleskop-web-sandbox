export interface Machine {
  id?: number
  code?: string
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
  waterCounterId?: number
  waterType0Do?: number
  waterType1Do?: number
  waterType2Do?: number
  waterType3Do?: number
  waterType4do?: number
  waterType5Do?: number
  waterType6Do?: number
  electricityCounterId?: number
}

export interface Consumption {
  IP_CONVERTOR: number
  HEATING_VALVE: number
  PROPORTIONAL: number
  STEAM_COEFFICENT: number
  TANK_0_TEMPERATURE: number
  TANK_0_LEVEL: number
  TANK_1_TEMPERATURE: number
  TANK_1_LEVEL: number
  TANK_2_TEMPERATURE: number
  TANK_2_LEVEL: number
  TANK_3_TEMPERATURE: number
  TANK_3_LEVEL: number
  TANK_4_TEMPERATURE: number
  TANK_4_LEVEL: number
  BOBIN_CAPACITY: number
  STEAM_CONSUMPTION_COEFFICENT: number
  STEAM_CORRECTION_COEFFICENT: number
  WATERTYPE_0_DO: number
  WATERTYPE_1_DO: number
  WATERTYPE_2_DO: number
  WATERTYPE_3_DO: number
  WATERTYPE_4_DO: number
  WATERTYPE_5_DO: number
  WATERTYPE_6_DO: number
  SU_SAYACI: number
  ELEKTRIK_SAYACI: number
  RESERVE_HEATING_VALVE: number
  DAILYWATERCONS_ENABLED: number
  DISCHARGE_VALVE_1: number
  DISCHARGE_VALVE_2: number
  DISCHARGE_VALVE_3: number
  DISCHARGE_VALVE_4: number
  DAILYWATERCONS_EVENT_HOUR: number
  DAILYWATERCONS_EVENT_MIN: number
  DAILYWATERCONS_PREVIOUS_STATUS: number
  DAILYWATERCONS_LAST_EVENT_TIME: string
  BUHAR_SAYACI_REEL: number
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
  manualCode: number
  manualName: string
  reportToERP?: boolean
}

export interface FinishReason {
  reasonId: string
  typeId: number
  text: string
  reportToERP?: number
}

export interface LockGeneral {
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
  aInLogicType?: number
  dInLogicType?: number
  commandLogicType?: number
  lockLogicType?: number
  dOutLogicType?: number
  vInLogicType?: number
  active: number
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
  plcIO: number
  icon?: string
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
  format: number
  pvNo: string
  returnValueName: string
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

export interface GlobalCommandFormula {
  formula: string
  formulaId: number
  commandNo: number
  commandParameterNo: number
  formulaName: string
}
