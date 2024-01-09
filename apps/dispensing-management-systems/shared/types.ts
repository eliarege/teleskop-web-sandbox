export interface JobOrder {
  jobId: number
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
  status: string
}
export interface Dispenser {
  dispenserId: number
  dispenserName: string
  dispenserIP: string
  dipenserPswrd: string
  lastConsumptionControl: Date
  dispenserType: number
  protocol: string
  readConsumptionFromDMS: BinaryType
  consumptionFilename: string
  bdyRequestName: string
  bdyRequestPath: string
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
  jobId: number
  batchCorrectionNo: number
  machineName: string
  machineId: number
  tankNo: number
  programNo: number
  programName: string
  recipeType: string
  recipeProcessNo: number
  stepNo: number
  recipeStepNo: number
  status: number
  dispenserId: number
  dispenserName: string
}
