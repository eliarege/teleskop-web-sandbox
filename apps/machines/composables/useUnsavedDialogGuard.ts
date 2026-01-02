import { klona } from 'klona'
import { isEqual } from 'lodash-es'
import { useEventListener } from '@vueuse/core'
import { useRouter } from 'vue-router'

interface UseUnsavedDialogGuardOptions<T> {
  getState: () => T
  setState: (state: T) => void
  isOpen: () => boolean
  shouldPreventLeave?: () => boolean
}

interface UseUnsavedDialogGuardResult {
  hasChanges: Ref<boolean>
  confirmVisible: Ref<boolean>
  requestClose: (action: () => void, cancelAction?: () => void) => void
  confirmDiscard: () => void
  keepEditing: () => void
  captureBaseline: () => void
  resetToBaseline: () => void
  markSaved: () => void
}

function cloneValue<T>(value: T): T {
  return klona(value)
}

export function useUnsavedDialogGuard<T>(options: UseUnsavedDialogGuardOptions<T>): UseUnsavedDialogGuardResult {
  const baseline = ref<T>()
  const hasChanges = ref(false)
  const confirmVisible = ref(false)
  const pendingAction = ref<(() => void) | null>(null)
  const pendingCancelAction = ref<(() => void) | null>(null)
  const router = useRouter()

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
      pendingCancelAction.value = null
      resetToBaseline()
    }
  }, { immediate: true })

  function requestClose(action: () => void, cancelAction?: () => void) {
    if (hasChanges.value) {
      pendingAction.value = action
      pendingCancelAction.value = cancelAction ?? null
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
    pendingCancelAction.value = null
  }

  function keepEditing() {
    confirmVisible.value = false
    pendingCancelAction.value?.()
    pendingAction.value = null
    pendingCancelAction.value = null
  }

  function markSaved() {
    captureBaseline()
  }

  const shouldPreventLeave = () => options.shouldPreventLeave?.() ?? hasChanges.value

  const removeGuard = router.beforeEach((_to, _from, next) => {
    if (!shouldPreventLeave()) {
      next()
      return
    }

    requestClose(() => {
      next()
    }, () => {
      next(false)
    })
  })

  let stopBeforeUnload: (() => void) | undefined
  if (typeof window !== 'undefined') {
    stopBeforeUnload = useEventListener(window, 'beforeunload', (event) => {
      if (!shouldPreventLeave())
        return
      event.preventDefault()
      event.returnValue = ''
    })
  }

  onScopeDispose(() => {
    removeGuard()
    stopBeforeUnload?.()
  })

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
