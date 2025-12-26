import { cloneDeep, isEqual } from 'lodash-es'

interface UseUnsavedDialogGuardOptions<T> {
  getState: () => T
  setState: (state: T) => void
  isOpen: () => boolean
}

interface UseUnsavedDialogGuardResult {
  hasChanges: Ref<boolean>
  confirmVisible: Ref<boolean>
  requestClose: (action: () => void) => void
  confirmDiscard: () => void
  keepEditing: () => void
  captureBaseline: () => void
  resetToBaseline: () => void
  markSaved: () => void
}

function cloneValue<T>(value: T): T {
  return cloneDeep(value)
}

export function useUnsavedDialogGuard<T>(options: UseUnsavedDialogGuardOptions<T>): UseUnsavedDialogGuardResult {
  const baseline = ref<T>()
  const hasChanges = ref(false)
  const confirmVisible = ref(false)
  const pendingAction = ref<(() => void) | null>(null)

  function captureBaseline() {
    baseline.value = cloneValue(options.getState())
    hasChanges.value = false
  }

  function resetToBaseline() {
    if (baseline.value === undefined)
      return
    options.setState(cloneValue(baseline.value))
    hasChanges.value = false
  }

  watch(options.getState, (value) => {
    if (!options.isOpen() || baseline.value === undefined)
      return
    hasChanges.value = !isEqual(value, baseline.value)
  }, { deep: true })

  watch(options.isOpen, (open) => {
    if (open) {
      captureBaseline()
    } else {
      confirmVisible.value = false
      pendingAction.value = null
      resetToBaseline()
    }
  }, { immediate: true })

  function requestClose(action: () => void) {
    if (hasChanges.value) {
      pendingAction.value = action
      confirmVisible.value = true
      return
    }
    action()
  }

  function confirmDiscard() {
    resetToBaseline()
    confirmVisible.value = false
    pendingAction.value?.()
    pendingAction.value = null
  }

  function keepEditing() {
    confirmVisible.value = false
    pendingAction.value = null
  }

  function markSaved() {
    captureBaseline()
  }

  return {
    hasChanges,
    confirmVisible,
    requestClose,
    confirmDiscard,
    keepEditing,
    captureBaseline,
    resetToBaseline,
    markSaved,
  }
}
