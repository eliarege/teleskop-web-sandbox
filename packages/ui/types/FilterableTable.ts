import type { QTableColumn } from 'quasar'

export interface Column extends QTableColumn {
  filterable?: boolean
  sortable?: boolean
  filterType?: 'select' | 'multiselect' | 'date' | 'comparison' | 'boolean' | 'equals' | 'includes'
  selectionOptions?: Array<any>
  optionLabel?: string
  optionValue?: string
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
