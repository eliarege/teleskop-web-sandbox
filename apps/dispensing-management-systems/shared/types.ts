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
  costUnit: string
  unitCost: number
}
export interface MaterialRequest {
  materialCode: string
  materialName: string
  amount: number
  status: number
}
export interface Machine {
  machineId: number
  machineName: string
  controllerType: number
}
export interface User {
  username: string
}
export interface TeleskopData {
  // dispenser
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
  // machine
  machineName: string
  machineId: number
  controllerType: number
  // job order
  jobId: number
  batchNo: number
  batchCorrectionNo: number
  tankNo: number
  programNo: number
  programName: string
  recipeType: string
  recipeProcessNo: number
  stepNo: number
  recipeStepNo: number
  status: number
}
