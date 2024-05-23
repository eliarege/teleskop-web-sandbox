import type { QMenuProps, VueClassProp, VueStyleProp } from 'quasar'

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
