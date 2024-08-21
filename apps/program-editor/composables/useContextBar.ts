import type { QBtnProps } from 'quasar'

interface CustomQBtnProps extends QBtnProps {
  tooltip?: string | number
  originalLabel?: string
  shortcut?: string
}

const route = useRoute()
const contextBarButtons = ref([] as CustomQBtnProps[])

function update(entries: Array<QBtnProps>) {
  contextBarButtons.value = entries
}

export function useContextBar(items: Ref<QBtnProps[]> | ComputedRef<QBtnProps[]>): void {
  watch(() => route.path, () => {
    update(items.value)
  })

  watchEffect(() => {
    update(items.value)
  })
}

export function useContextBarState() {
  return {
    contextBarButtons,
  }
}
