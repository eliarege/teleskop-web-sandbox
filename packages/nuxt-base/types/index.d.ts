import type { MenuProps, QTableColumn, VueClassProp, VueStyleProp } from 'quasar'

export interface TopbarMenuProps {
  anchor?: QMenuProps['anchor']
  self?: QMenuProps['self']
  fit?: boolean
  cover?: boolean
  offset?: [number, number]
  items: TopbarMenuItem[][]
  itemClass?: VueClassProp
  itemStyle?: VueStyleProp
}

export interface TopbarMenuItem {
  label: MaybeRef<string>
  to?: MaybeRef<string>
  icon?: MaybeRef<string>
  class?: VueClassProp
  active?: MaybeRef<boolean>
  shortcut?: string
  style?: VueStyleProp
  disabled?: MaybeRef<boolean>
  onClick?: () => void
  subMenu?: TopbarMenuProps
}

export interface FilterableTableColumn extends QTableColumn {
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
