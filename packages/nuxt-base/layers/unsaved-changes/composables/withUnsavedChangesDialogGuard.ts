import type { useDialogPluginComponent } from 'quasar'
import { isDef } from '@teleskop/utils'
import {
  type UnsavedChangesCoreOptions,
  createUnsavedChangesCore,
} from '../lib/core'

interface UseUnsavedDialogGuardOptions<T> extends UnsavedChangesCoreOptions<T> {
  dialog?: {
    title?: string
    /** Message shown when the dialog is dismissed */
    dismissMessage?: string
    /** Message shown when the user attempts to leave the route with unsaved changes */
    beforeRouteLeaveMessage?: string
    saveLabel?: string
    discardLabel?: string
    cancelLabel?: string
  }
}

type UnsavedDialogReturn = ReturnType<typeof useDialogPluginComponent> & {
  saving: Readonly<Ref<boolean>>
  hasChanges: () => boolean
  markSaved: () => void
  showGuard: () => ReturnType<ReturnType<typeof useQuasar>['dialog']>
  onDialogBeforeHide: (event: Event) => void
}

/**
 * Wraps Quasar's `useDialogPluginComponent` to add unsaved changes protection for dialog components.
 *
 * Provides comprehensive change tracking and warnings when:
 * - User tries to close the dialog via backdrop, X button, or ESC
 * - User tries to navigate to another route while dialog is open
 * - User tries to close/reload the browser window
 *
 * The composable tracks state changes using deep equality comparison and prompts users
 * with options to save, discard, or cancel the action. If `saveState` is provided,
 * users will see a "Save" option; otherwise, only "Discard" and "Cancel" are shown.
 *
 * @param ctx - The return value from Quasar's `useDialogPluginComponent()`
 * @param options - Configuration options
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const props = defineProps<{ data: UserData }>()
 * defineEmits(useDialogPluginComponent.emits)
 *
 * const formData = ref({ ...props.data })
 *
 * const { dialogRef, onDialogOK, onDialogCancel, onDialogHide, onDialogBeforeHide, saving, markSaved } =
 *   withUnsavedChangesDialogGuard(useDialogPluginComponent(), {
 *     getState: () => formData.value,
 *     saveState: async (data) => {
 *       await api.updateUser(data)
 *     },
 *     dialog: {
 *       title: 'Unsaved Changes',
 *       dismissMessage: 'You have unsaved changes. Do you want to save before closing?',
 *       beforeRouteLeaveMessage: 'You have unsaved changes in this dialog. Save before leaving?',
 *     }
 *   })
 *
 * // After external save operation
 * const handleExternalSave = async () => {
 *   await saveData()
 *   markSaved() // Update baseline to prevent false positive warnings
 * }
 * </script>
 *
 * <template>
 *   <q-dialog ref="dialogRef" :on-before-hide="onDialogBeforeHide" :on-hide="onDialogHide">
 *     <q-card>
 *       <q-input v-model="formData.name" />
 *       <q-card-actions>
 *         <q-btn :on-click="onDialogOK" :loading="saving">OK</q-btn>
 *         <q-btn :on-click="onDialogCancel" :disable="saving">Cancel</q-btn>
 *       </q-card-actions>
 *     </q-card>
 *   </q-dialog>
 * </template>
 * ```
 *
 * @remarks
 * - Requires a patched Quasar version that supports `event.qPreventHide` flag in before-hide event
 * - The `onDialogOK` handler will automatically attempt to save if changes exist
 * - If save fails and user doesn't retry, the dialog closes via cancel to avoid passing stale data
 * - Router navigation is blocked until changes are saved or discarded
 */
export function withUnsavedChangesDialogGuard<T>(
  ctx: ReturnType<typeof useDialogPluginComponent>,
  options: UseUnsavedDialogGuardOptions<T>,
): UnsavedDialogReturn {
  const router = useRouter()
  const isExiting = ref(false)
  const instance = getCurrentInstance()
  if (!instance)
    throw new Error('withUnsavedDialogGuard must be used within a Vue component instance')

  const core = createUnsavedChangesCore(options)

  const shouldBlockNavigation = () => core.enabled.value && core.hasChanges() && !isExiting.value

  // Setup beforeunload listener
  useEventListener(window, 'beforeunload', (event) => {
    if (shouldBlockNavigation()) {
      event.preventDefault()
    }
  })

  const unsavedChangesGuard = (type: 'route-leave' | 'dialog-close') => {
    if (!shouldBlockNavigation()) {
      return null
    }
    const message = type === 'route-leave'
      ? options.dialog?.beforeRouteLeaveMessage
      : options.dialog?.dismissMessage
    return core.createUnsavedChangesGuard(isDef(options.saveState), message)
  }

  /**
   * Force close the dialog without saving
   */
  function exitWithoutSaving(): void {
    isExiting.value = true
    ctx.onDialogCancel()
  }

  const unhook = router.beforeEach(() => {
    const guard = unsavedChangesGuard('route-leave')
    if (!guard)
      return true

    return new Promise<boolean>((resolve) => {
      guard
        .onOk(async (payload: 'discard' | 'confirm') => {
          if (payload === 'discard') {
            isExiting.value = true
            resolve(true)
          }
          if (payload === 'confirm') {
            const state = core.getCurrentState()
            const saved = await core.saveChanges(state)
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

  /** Should be attached to the dialog's before-hide event */
  const onDialogBeforeHide = (event: Event & { qPreventHide?: boolean }): void => {
    const guard = unsavedChangesGuard('dialog-close')
    if (!guard)
      return

    // Patched `quasar` package to support `qPreventHide` flag on the event object
    event.qPreventHide = true
    guard
      .onOk(async (payload: 'discard' | 'confirm') => {
        if (payload === 'discard') {
          return exitWithoutSaving()
        }
        if (payload === 'confirm') {
          const state = core.getCurrentState()
          const saved = await core.saveChanges(state)
          if (!saved) {
            return exitWithoutSaving()
          }
          isExiting.value = true
          ctx.onDialogOK(state)
        }
      })
      .onCancel(() => {
        // User cancelled the unsaved changes dialog, stay in main dialog
      })
  }

  const onDialogOK = async (): Promise<void> => {
    const state = core.getCurrentState()
    if (core.hasChanges(state)) {
      const saved = await core.saveChanges(state)
      if (!saved) {
        return exitWithoutSaving()
      }
    }
    isExiting.value = true
    return ctx.onDialogOK(state)
  }

  const onDialogCancel = (): void => {
    const guard = unsavedChangesGuard('dialog-close')
    if (!guard) {
      isExiting.value = true
      return ctx.onDialogCancel()
    }

    guard
      .onOk(async (payload: 'discard' | 'confirm') => {
        if (payload === 'discard')
          return exitWithoutSaving()
        if (payload === 'confirm') {
          const state = core.getCurrentState()
          const saved = await core.saveChanges(state)
          if (!saved) {
            return exitWithoutSaving()
          }
          isExiting.value = true
          return ctx.onDialogOK(state)
        }
      })
      .onCancel(() => {
        // User cancelled the unsaved changes dialog, stay in main dialog
      })
  }

  return {
    ...ctx,
    saving: readonly(core.saving),
    hasChanges: core.hasChanges,
    markSaved: core.markSaved,
    showGuard: () => core.createUnsavedChangesGuard(isDef(options.saveState)),
    onDialogOK,
    onDialogCancel,
    onDialogBeforeHide,
  }
}
