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
  chemCode: string
  programProcessNo: number
  amount: number
  unit: number
}
export interface Dispenser {
  dispenserId: number
  dispenserName: string
  dispenserIP: string
  dipenserPswrd: string
  lastConsumptionControl: Date
  dispenserType: number
  protocol: string
  readConsumptionFromDMS: boolean
  consumptionFilename: string
  fileName: string
  filePath: string
}
export interface DispenserType {
  dispenserTypeId: number
  dispenserTypeName: string
}
export interface Material {
  materialCode: string
  materialName: string
  materialGroupNo: number
  density: number
  ph: number
  source: string
  costUnit: string
  unitCost: number
  reRequestable: boolean
  directTransfer: boolean
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
  batch: string
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
  autoMan: boolean
}
export interface WeighingManual {
  batch: string
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
}
export interface MachineControllerType {
  controllerTypeId: number
  controllerTypeName: string
}
