import type { MachineGroupType } from '@teleskop/core'
import type { QTableProps } from 'quasar'

export interface Machine {
  machineId: number
  machineCode: string
  groupId: number
  groupName: string
  tbbModel: string
  plcModel: string
  ip: string
  theoreticalCharge: string
  theoreticalChargeDuration: string
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
  storeElectricityAsInc: boolean
  theoreticalWater: boolean
  inUse: boolean
  MTTempIo: number
  MTOptions: {
    id: number
    name: string
  }[]
  version: string
  productModel: string
  hardwareModel: string
  steamValveDo: number
  steamValveOptions: {
    ioId: number
    ioName: string
  }[]
  theoreticalSteam: boolean
}

export interface User {
  userId: number
  userName: string
  userSurname: string
  userPass: string
  userInfo: string
  userActive: boolean
  userMode: string
  userMode2: string
  userType: number
  userDeleted: boolean
}

export interface StopReason {
  stopCode: number
  stopName: string
  reportToERP: boolean
}

export interface ManualReason {
  manualId: number
  manualReason: string
  reportToERP: boolean
}

export interface FinishReason {
  reasonId: string
  typeId: number
  text: string
  reportToERP: number
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
  machineId: number
  commandNo: number
  reasonText: string
  commandNumbers: number[]
  groupId: number
}

export interface MachineParameter {
  machineParameterId: number
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

export interface CommandIO {
  id: number
  commandNo: number
  card: number
  channel: number
  name: string
  enabled: number
  plcIO: number
  icon: string
  chooseList: []
}

export interface IOOutput extends CommandIO {
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
  machineId: number
  commandNo: number
  commandName: string
  commandType: number
  x: string
  y: string
  a: string
  maxA: string
  b: string
  adviceList: string
  dontUseList: string
  functionId: number
  tbbFunctionName: string
  name: string
  activated: number
  isRunManual: number
  moveParallel: number
  changeTime: Date
  tbbChangeTime: Date
  isDeleted: number
  isChanged: number
  isTemperature: number
  isUnload: number
  icon: string
  groupId: number
  type: number
  machineConstantId: number
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
  machineId: number
  paramId: number
  paramName: string
  paramType: number
  erpFieldName: string
  batchReportVisible: number
  batchReportOrder: number
  partyNoParam: number
}

export interface CommandType {
  machineId: number
  commandNo: number
  commandType: number
  commandName: string
}

export interface CommandTypeEvent extends CommandType {
  action: string
}

export interface TreatmentParameter {
  id: number
  unit: string
  treatmentParameter: string
  minValue: number
  maxValue: number
}

export interface TreatmentMachineGroup {
  id: number
  groupName: string
  temperatureControlCommand: number
}

export interface AnalogLock {
  lockNo: number
  outputs: {
    outputId: number
    percentage: number | null
  }[]
}
export interface DigitalLock {
  lockNo: number
  outputs: {
    outputId: number
    state: number | null
  }[]
}
export interface Material {
  materialId: number
  materialCode: string
  machineId: number
  materialName: string
  materialGroupNo: number
  preWater: number | null
  betweenWater: number | null
  postWater: number | null
}
export interface TankDefinition {
  machineId: number
  tankName: string
  tankNo: number
  materials: Material[]
}
export interface WaterIO {
  machineId: number
  commandNo: number
  ioIndex: number
  ioId: number
  ioType: number
  name: string
  programEditing: boolean
  commandRun: boolean
}

export interface BatchParam {
  machineId: number
  paramId: number
  paramString: string
}

export interface Formula {
  formulaId: number
  formulaName: string
  machineId: number
  formula: string
  commandNo: number
  commandName: string
  parameterIndex: number
  parameterName: string
}

export interface MachineGroup {
  groupId: number
  groupName: string
  groupType: MachineGroupType
}

export interface CommandTimeoutReason {
  id: number
  machineId?: number
  commandNo?: number
  reasonText: string
  checked?: boolean
}

export interface StartingParameter {
  paramId: number
  paramString: string
}

export interface CommandParameter {
  machineId: number
  commandNo: number
  parameterIndex: number
  paramString: string
  commandDefinition: string
  programEditing: boolean
  batchPlanning: boolean
  batchStart: boolean
  commandRun: boolean
  recipe: string
  value: string
  parameterType: string
  selectionList: string
  selectionValues: string
  unitCode: string
  paramLowLimit: number
  paramHighLimit: number
  containsVariable: boolean
  temperature: boolean
  useDefault: boolean
  isCommandVariable: boolean
  tbbFormul: string
  useFormula: boolean
}

export interface Setting {
  caption: string
  token: string | number
  isActive?: boolean
}

export interface ColumnSchema {
  filled: boolean
  validation: string
  disabled: boolean
}

export interface ColumnDefinition {
  label: string
  field: string
  align: 'left' | 'right' | 'center'
  filterable: boolean
  filterType: 'includes' | 'startsWith' | 'equals' | string
  unique: boolean
  type: 'string' | 'number' | 'boolean' | string
  visible: boolean
  editable: boolean
  schema: ColumnSchema
}

export type Columns = Record<string, ColumnDefinition>

export interface MachineTableColumn extends Omit<QTableColumn, 'label'> {
  name: string
  label: string
  field: keyof Machine | ((row: Machine) => any)
  sortable?: boolean
  visible?: MaybeRefOrGetter<boolean>
  align?: 'left' | 'right' | 'center'
  format?: (value: any, row: Machine) => string
  tooltip?: (value: any, row: Machine) => string
}

export type QTableColumn<
  Row extends Record<string, any> = any,
  Key = keyof Row extends string ? keyof Row : string,
  Field = Key | ((row: Row) => any),
> = Omit<NonNullable<QTableProps['columns']>[number], 'field' | 'format'> & {
  field: Field
  format?: (val: any, row: Row) => string
}

export interface IOOption {
  machineId: number
  ioId: number
  ioName: string
}
