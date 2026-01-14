import type { QBtnProps } from 'quasar'

export interface CustomQBtnProps extends QBtnProps {
  tooltip?: string | number
  originalLabel?: string
  shortcut?: string
  visible?: boolean
}

const contextBarButtons = ref<CustomQBtnProps[]>([])

export function useContextBar(
  items: Ref<CustomQBtnProps[]> | ComputedRef<CustomQBtnProps[]>,
) {
  watch(
    items,
    (newItems) => {
      contextBarButtons.value = newItems ?? []
    },
    { immediate: true },
  )
}

export function useContextBarState() {
  return {
    contextBarButtons: readonly(contextBarButtons),
  }
}
