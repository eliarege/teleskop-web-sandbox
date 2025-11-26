export interface OptionMap {
  id: number
  name: string
}
export interface JobOrder {
  jobId: number
  batchNo: string
  batchCorrectionNo: number
  machineName: string
  machineId: number
  dispenserId: number
  tankNo: number
  programNo: number
  programName: string
  stepNo: number
  recipeType: string
  recipeProcessNo: number
  recipeStepNo: number
  priority: number
  status: number
  type: number
}
export interface ProgramHeader {
  machineId: number
  programNo: number
  programName: string
  programType: number
  chemRequests: number
  dyeRequests: number
  saltRequests: number
}
export interface CommandParameter {
  machineId: number
  programNo: number
  mainStep: number
  parallelStep: number
  paramIndex: number
  isOptimized: boolean
  optimizedValue: number | null
  commandNo: number
  commandName: string
  paramId: number
  paramName: string
  minValue: number
  maxValue: number
  unit: number
  selectedValue: number
}
export interface BatchPlan {
  planKey: number
  batch: string
  batchCorrectionNo: number
  plannedMachine: number
  plannedStartDate: Date
}
export interface BatchRecipeStep {
  planKey: number
  batch: string
  mainStep: number
  parallelStep: number
  recipeType: number
  ISN: number
  processOrder: number
  materialCode: string
  programProcessNo: number
  amount: number
  unit: number
}
export interface BatchPlanParameter {
  planKey: number
  paramId: number
  paramName: string
  value: string
  paramType: number
  unit: number
}
export interface Dispenser {
  dispenserId: number
  dispenserName: string
  dispenserIP: string
  dispenserType: number | null
  dispenserBrandId: number
  dispenserBrandName: string
  vncUser: string | null
  vncPassword: string | null
  vncPort: number | null
  lastConsumptionControl?: string | null
  protocol: string
  protocolFields?: unknown
  JDMConnections: number[] | null
}
export interface DispenserBrand {
  dispenserBrandId: number
  dispenserBrandName: string
}
export interface DispenserType {
  dispenserTypeId: number
  dispenserTypeName: string
  dispenserBrandId: number
  dispenserBrandName: string
}
export interface Protocol {
  dispenserBrandId: number
  protocol: string
  fields: string[]
}
export interface Material {
  materialCode: string
  materialName: string
  materialGroupNo: number
  density: number
  ph: number
  source: string | null
  costUnit: string | null
  unitCost: number | null
  reRequestable: boolean
  directTransfer: boolean
  isManual: boolean
  connectedDispensers: Dispenser[] | null
}
export interface MaterialRequest {
  jobId: number
  materialCode: string
  materialName: string
  recipeAmount: number
  realAmount: number
  mainStep: number
  parallelStep: number
  dispenserId: number
  status: number
  unit: number
}
export interface WeighingAuto {
  jobId: number
  programNo: string
  machineName: string
  dispenserId: number
  processOrder: number
  mainStep: number
  parallelStep: number
  materialCode: number
  materialName: string
  recipeAmount: number
  actualAmount: number
  status: number
  requestTime: Date
  completedTime: Date
  interval: number
}
export interface WeighingManual {
  batchNo: string
  correctionNo: number
  weighingNumber: number
  recipeType: number
  materialCode: string
  materialName: string
  actualAmount: number
  status: number
  requestTime: Date
}
export interface MaterialGroup {
  materialGroupNo: number
  materialGroupName: string
}
export interface Machine {
  machineId: number
  machineName: string
  machineGroup: number
  controllerType: number
  capacity: number | null
  connectedDispensers: Dispenser[] | null
}
export interface MachineControllerType {
  controllerTypeId: number
  controllerTypeName: string
}
export interface MachineGroup {
  groupId: number
  groupName: string
}
export interface Tank {
  machineId: number
  tankNo: number
  tankName: string
  tankCap: number
  dispenserId: number
  additionalCap: number
  tankType: number
  autoWaterSystem: boolean
  externalWaterSystem: boolean
  levelSensorPlcNo: number
  levelSensorPlcId: number
  levelSensorInputNo: number
  fillWaterBeforePercentage: number
  mixingTime: number
  desTankId: number
}
export interface RecipeMaster {
  recipeId: number
  recipeName: string
}
export interface RecipeMasterStep {
  recipeId: number
  machineId: number
  programNo: number
  programName: string
  stepNo: number
  steps: { type: number, stepNo: number, materials: RecipeMasterMaterial[] }[]
  chemRequests: number
  dyeRequests: number
  saltRequests: number
  chemSteps: RecipeMasterMaterial[]
  dyeSteps: RecipeMasterMaterial[]
  saltSteps: RecipeMasterMaterial[]
  flotte: number | undefined
  flotteRatio: number | undefined
  totalWeight: number | undefined
}
export interface RecipeMasterMaterial {
  materialCode: string
  materialName: string
  isManual: boolean
  unit: number
  amount: number
  type: number
  orderNo: number
  programIndex: number
  calculated: number | undefined
}
export interface RecipeProgramMaster {
  recipeId: number
  recipeName: string
  recipeGroup: number
  recipeType: number
  machineId: number
  comment: string
  prepTime: Date
  lastUpdate: Date
  stepNo: number
  programNo: number
  colorCode: number
  colorName: string
  isPassive: boolean
  variantName?: string
}
export interface RecipeProgramMasterStep {
  recipeId: number
  materialCode: string
  materialName: string
  mainStep: number
  parallelStep: number
  amount: number
  unit: number
}
export interface RecipeVariant {
  recipeId: number
  machineId: number
  variantName: string
  colorCode: number
  colorName: string
}
export interface JobOrderParams {
  jobNo: string
  numberOfJobs: number
  totalWeight: number
  partyNo: number
  orderNo: number
  notes: string
  customerName: string
  fabricType: string
  flotte: number | undefined
  flotteRatio: number | undefined
  yarn: string | undefined
  ASNo: string | undefined
}
export interface ContinueJobOrderParams {
  jobNo: string
  fabricSize: number
  fabricWeight: number
  grammage: number
  colorCode: string
  flotte: number
  volume: number
  foulard: number
  startDate: string
}
export interface CommandType {
  machineId: number
  commandNo: number
  commandType: number
  commandName: string
}
export interface Customer {
  customerId: number
  customerNo: number
  customerName: string
  customerNotes: string
}
export interface FabricType {
  fabricTypeId: number
  fabricTypeName: string
  fabricTypeNotes: string
}
export interface DatabaseConnection {
  client: string
  hostComputer: string
  user: string
  password: string
  database: string
  host: string
  port: number
  type: string
}
