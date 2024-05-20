import type { QMenuProps, VueClassProp, VueStyleProp } from 'quasar'

export interface TopbarMenuProps {
  anchor?: QMenuProps['anchor']
  self?: QMenuProps['self']
  fit?: boolean
  cover?: boolean
  offset?: [number, number]
  items: TopbarMenuItem[][]
}

export interface TopbarMenuItem {
  label: string
  class?: VueClassProp
  style?: VueStyleProp
  disabled?: boolean
  onClick?: () => void
  subMenu?: TopbarMenuProps
}
