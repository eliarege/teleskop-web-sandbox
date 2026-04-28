import type { QBtnProps } from 'quasar'

export interface CustomQBtnProps extends QBtnProps {
  tooltip?: string | number
  originalLabel?: string
  shortcut?: string
  visible?: boolean
}

const contextBarButtons = ref<CustomQBtnProps[]>([])
let currentOwner: Ref<CustomQBtnProps[]> | ComputedRef<CustomQBtnProps[]> | null = null

export function useContextBar(
  items: Ref<CustomQBtnProps[]> | ComputedRef<CustomQBtnProps[]>,
) {
  currentOwner = items

  watch(
    items,
    (newItems) => {
      contextBarButtons.value = newItems ?? []
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (currentOwner === items) {
      contextBarButtons.value = []
      currentOwner = null
    }
  })
}

export function useContextBarState() {
  return {
    contextBarButtons: readonly(contextBarButtons),
  }
}
