export interface RecipeLatest {
  joborder: number | null
  recipeType: number | null
  processOrder: number | null
  ISN: number | null
  mainStep: number | null
  parallelStep: number | null
  chemCode: string | null
  materialName: string | null
  programProcessNo: number | null
  amount: number | null
  recipeAmount: number | null
  unit: string | null
  programNo: number | null
  programName: string | null
}

// Transfer enums
export enum TransferSource {
  File = 0,
  Exchange = 1,
  Dms = 2,
}

export enum TransferStatus {
  Success = 0,
  SuccessWithoutRecipe = 1,
  Failed = 2,
}

export enum TransferType {
  Append = 0,
  Update = 1,
  Delete = 2,
}

// Transfer interfaces
export interface BatchTransferInfo {
  id: number
  joborder: number
  correctionNo: number
  machineid: number
  machinecode?: string
  transferDate: Date
  transferType: TransferType
  transferStatus: TransferStatus
  transferSource: TransferSource
}

export interface BatchTransferInfoDetail {
  explanation: string
}
