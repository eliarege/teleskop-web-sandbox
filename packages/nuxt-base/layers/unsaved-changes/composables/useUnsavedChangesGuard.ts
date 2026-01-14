import { isDef } from '@teleskop/utils'
import {
  type UnsavedChangesCoreOptions,
  type UnsavedChangesDialogOptions,
  createUnsavedChangesCore,
} from '../lib/core'

interface UseUnsavedChangesGuardOptions<T> extends UnsavedChangesCoreOptions<T> {
  dialog?: UnsavedChangesDialogOptions
}

interface UseUnsavedChangesGuardReturn {
  saving: Readonly<Ref<boolean>>
  hasChanges: () => boolean
  markSaved: () => void
  showGuard: () => ReturnType<ReturnType<typeof useQuasar>['dialog']>
}

/**
 * Composable to guard against unsaved changes in regular page components.
 *
 * Provides change tracking and warnings when:
 * - User tries to navigate to another route
 * - User tries to close/reload the browser window
 *
 * The composable tracks state changes using deep equality comparison and prompts users
 * with options to save, discard, or cancel the navigation. If `saveState` is provided,
 * users will see a "Save" option; otherwise, only "Discard" and "Cancel" are shown.
 *
 * @param options - Configuration options
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const formData = ref({ name: '', email: '', message: '' })
 *
 * const { saving, hasChanges, markSaved } = useUnsavedChangesGuard({
 *   getState: () => formData.value,
 *   saveState: async (data) => {
 *     await api.updateProfile(data)
 *   },
 *   dialog: {
 *     title: 'Unsaved Changes',
 *     message: 'You have unsaved changes. Do you want to save before leaving?',
 *   }
 * })
 *
 * // After external save operation
 * const handleSave = async () => {
 *   await saveData()
 *   markSaved() // Update baseline to prevent false positive warnings
 * }
 * </script>
 *
 * <template>
 *   <form>
 *     <input v-model="formData.name" />
 *     <button :on-click="handleSave" :disabled="saving || !hasChanges()">
 *       Save
 *     </button>
 *   </form>
 * </template>
 * ```
 *
 * @example
 * Without auto-save (confirmation only)
 * ```ts
 * // If you only want to confirm before leaving without auto-saving
 * const { hasChanges } = useUnsavedChangesGuard({
 *   getState: () => formData.value,
 *   // No saveState provided - shows only "Discard" and "Cancel" options
 *   dialog: {
 *     message: 'Are you sure you want to leave? Changes will be lost.',
 *   }
 * })
 * ```
 *
 * @remarks
 * - If save fails and user doesn't retry, navigation is blocked
 * - Router navigation is blocked until changes are saved or discarded
 * - Browser beforeunload event shows native confirmation dialog
 */
export function useUnsavedChangesGuard<T>(
  options: UseUnsavedChangesGuardOptions<T>,
): UseUnsavedChangesGuardReturn {
  const router = useRouter()
  const isNavigating = ref(false)

  const core = createUnsavedChangesCore(options)

  const shouldBlockNavigation = () => core.enabled.value && core.hasChanges() && !isNavigating.value

  // Setup beforeunload listener
  useEventListener(window, 'beforeunload', (event) => {
    if (shouldBlockNavigation()) {
      event.preventDefault()
    }
  })

  const unsavedChangesGuard = () => {
    return shouldBlockNavigation()
      ? core.createUnsavedChangesGuard(isDef(options.saveState))
      : null
  }

  // Router navigation guard
  const unhook = router.beforeEach(() => {
    const guard = unsavedChangesGuard()
    if (!guard)
      return true

    return new Promise<boolean>((resolve) => {
      guard
        .onOk(async (payload: 'discard' | 'confirm') => {
          if (payload === 'discard') {
            isNavigating.value = true
            resolve(true)
          }
          if (payload === 'confirm') {
            const state = core.getCurrentState()
            const saved = await core.saveChanges(state)
            if (saved) {
              isNavigating.value = true
            }
            // If save failed, block navigation so user can stay and retry or discard
            resolve(saved)
          }
        })
        .onCancel(() => {
          resolve(false)
        })
    })
  })

  onUnmounted(() => {
    unhook()
  })

  return {
    saving: readonly(core.saving),
    hasChanges: core.hasChanges,
    markSaved: core.markSaved,
    showGuard: () => core.createUnsavedChangesGuard(isDef(options.saveState)),
  }
}
