export interface JobOrder {
  jobId: number
  batchNo: number
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
}
export interface ProgramHeader {
  machineId: number
  programNo: number
  programName: number
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
  controllerType: number
  connectedDispensers: Dispenser[] | null
}
export interface MachineControllerType {
  controllerTypeId: number
  controllerTypeName: string
}
export interface RecipeMaster {
  recipeId: number
  recipeName: string
  recipeGroup: number
  recipeType: number
  comment: string
  prepTime: Date
  lastUpdate: Date
  stepNo: number
  programNo: number
  machineId: number
  isPassive: boolean
}
export interface RecipeMasterStep {
  recipeId: number
  materialCode: string
  materialName: string
  mainStep: number
  parallelStep: number
  amount: number
  unit: number
}
export interface DatabaseConnection {
  client: string
  hostComputer: string
  user: string
  password: string
  database: string
  host: string
  port: number
}
