export interface Column {
  name: string
  field: string
  label: string
  sortable: boolean
}

export interface Recipe {
  planKey: number | null;
  recIndex: number | null;
  recNo: number | null;
  name: string | null;
  reqNumber: number | null;
  mainStep: number | null;
  parallelStep: number | null;
  recType: number | null;
  chemCode: string | null;
  materialName: string | null;
  amount: number | null;
  reqBatchNo: number | null;
  reqProgNo: number | null;
  otherUnit: number | null;
  phaseNo: number | null;
  phaseIndex: number | null;
  washingName: string | null;
  unit: number;
}

export interface RecipeLatest {
  joborder: number | null;
  recipeType: number | null;
  processOrder: number | null;
  ISN: number | null;
  mainStep: number | null;
  parallelStep: number | null;
  chemCode: string | null;
  materialName: string | null;
  programProcessNo: number | null;
  amount: number | null;
  unit: string | null;
  programNo: number | null;
}

