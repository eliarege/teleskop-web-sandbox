export interface Recipe {
  planKey: number | null
  recIndex: number | null
  recNo: number | null
  name: string | null
  reqNumber: number | null
  mainStep: number | null
  parallelStep: number | null
  recType: number | null
  chemCode: string | null
  materialName: string | null
  amount: number | null
  reqBatchNo: number | null
  reqProgNo: number | null
  otherUnit: number | null
  phaseNo: number | null
  phaseIndex: number | null
  washingName: string | null
  unit: number
}

export interface Column {
  name: string
  field: string
  label: string
  filterable?: boolean // If it is flase, no filter will be applied
  sortable?: boolean
  filterType?: 'select' | 'multiselect' | 'date' | 'comparison' | 'boolean'
  selectionOptions?: Array // Necessary if filterType is select or multiselect
  optionLabel?: string // Necessary if each element of selectionOptions array has more than one attributes
  optionValue?: string // Returns optionValue on select and multiselect if specified else return the whole object
  // Optionvalue is not implemented for now
}

export interface DateType {
  text?: string
  from: Date
  to: Date
}

export interface FilterSlot {
  label: string
  field: string
  isOrderFilter?: boolean
  filterType: string
  optionValue?: string
  value: {
    option?: Array<any>
    from?: Date
    to?: Date
    min?: number
    max?: number
    operator?: string
    number?: number
    direction?: string
  }
}

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
  unit: string | null
  programNo: number | null
}
