import type { Placement } from '@floating-ui/vue'

export interface TopBarItem {
  label: string
  disabled?: boolean
  route?: string
  icon?: string
  class?: string
  placement?: Placement
  children?: TopBarItem[]
  onClick?: (...args: any[]) => any
}

export interface TopBarItemStyle {
  fontSize: string
  gap: string
  bgColor: string
  textColor: string
  selectedBgColor: string
  selectedTextColor: string
}
