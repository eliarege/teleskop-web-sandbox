import type { QMenuProps, QTableColumn, VueClassProp, VueStyleProp } from 'quasar'

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
  label: MaybeRefOrGetter<string>
  to?: MaybeRefOrGetter<string>
  icon?: MaybeRefOrGetter<string>
  class?: VueClassProp
  active?: MaybeRefOrGetter<boolean>
  hidden?: MaybeRefOrGetter<boolean>
  shortcut?: string
  style?: VueStyleProp
  disabled?: MaybeRefOrGetter<boolean>
  disableReason?: MaybeRefOrGetter<string>
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
  trueLabel?: string
  falseLabel?: string
}

export interface FilterableTableFilter {
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

export interface AppProperties {
  readonly name: string
  readonly version: string
  readonly buildDate: string
  readonly commitHash: string
  readonly nodeVersion: string
}
