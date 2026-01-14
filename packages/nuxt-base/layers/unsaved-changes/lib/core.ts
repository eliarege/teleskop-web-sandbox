import isEqual from 'fast-deep-equal'
import { klona } from 'klona'
import type { DeepReadonly } from 'vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'

export interface UnsavedChangesDialogOptions {
  /** Dialog title */
  title?: string
  /** Dialog message */
  message?: string
  /** Save button label */
  saveLabel?: string
  /** Discard button label */
  discardLabel?: string
  /** Cancel button label */
  cancelLabel?: string
}

export interface UnsavedChangesCoreOptions<T> {
  /** Function to get the current state for change detection */
  getState: () => T
  /**
   * Function to save the current state. Shows retry dialog on failure (if not explicitly disabled)
   *
   */
  saveState?: (data: T) => any
  /** Callback invoked on save error */
  onSaveError?: (error: any) => void
  /** Whether unsaved changes detection is enabled */
  enabled?: MaybeRefOrGetter<boolean>
  /** Whether to retry saving on failure (default: true) */
  retryOnSaveFailure?: boolean
  /** Dialog options for unsaved changes warnings */
  dialog?: MaybeRefOrGetter<UnsavedChangesDialogOptions>
}

export interface UnsavedChangesCoreReturn<T> {
  saving: Ref<boolean>
  enabled: ComputedRef<boolean>
  baseline: DeepReadonly<Ref<T>>
  getCurrentState: () => T
  hasChanges: (state?: T) => boolean
  markSaved: () => void
  createUnsavedChangesGuard: (withSave: boolean, message?: string) => ReturnType<ReturnType<typeof useQuasar>['dialog']>
  saveChanges: (state: T) => Promise<boolean>
}

/**
 * Core logic for unsaved changes detection and handling.
 * Shared between withUnsavedDialogGuard and useUnsavedChangesGuard.
 */
export function createUnsavedChangesCore<T>(
  options: UnsavedChangesCoreOptions<T>,
): UnsavedChangesCoreReturn<T> {
  const $q = useQuasar()
  const { t } = useNuxtApp().$i18n
  const saving = ref(false)
  const enabled = computed(() => toValue(options.enabled) ?? true)

  const getCurrentState = () => klona(options.getState())

  const baselineRef = ref(getCurrentState()) as Ref<T>

  const hasChanges = (state = options.getState()) => {
    return !isEqual(baselineRef.value, state)
  }

  /** Marks the current state as saved, updating the baseline for change detection */
  const markSaved = () => {
    baselineRef.value = getCurrentState()
  }

  /**
   * Creates a dialog to warn user about unsaved changes.
   *
   * When user picks a action, `.onOk()` handler gets passed `"discard"` or `"confirm"` payload.
   *
   * @param withSave Whether to show the Save option in the dialog
   * @param message Override default message to show in the dialog
   *
   * @returns The dialog chain object to handle user response, or null if no unsaved changes
   */
  const createUnsavedChangesGuard = (withSave: boolean, message?: string) => {
    const dialogOptions = toValue(options.dialog)
    const saveAction = { label: dialogOptions?.saveLabel || t('unsavedChanges.save'), value: 'confirm' as const }
    const discardAction = { label: dialogOptions?.discardLabel || t('unsavedChanges.discard'), value: 'discard' as const }

    const actions = withSave ? [saveAction, discardAction] : [discardAction]

    return $q.dialog({
      component: ConfirmDialog,
      componentProps: {
        title: dialogOptions?.title,
        message: message || dialogOptions?.message,
        okActions: actions,
        cancelLabel: dialogOptions?.cancelLabel,
        dialogProps: {
          transitionShow: 'fade',
          transitionHide: 'fade',
          noBackdropDismiss: true,
          noShake: true,
        },
      } satisfies Partial<InstanceType<typeof ConfirmDialog>['$props']>,
    })
  }

  /** Ask user if they want to retry saving changes */
  const promptForRetry = () => {
    return new Promise<boolean>((resolve) => {
      $q.dialog({
        component: ConfirmDialog,
        componentProps: {
          title: t('unsavedChanges.retrySaveTitle'),
          message: t('unsavedChanges.retrySaveMessage'),
          okActions: [{ label: t('unsavedChanges.retrySaveOk'), value: 'ok' }],
          cancelLabel: t('unsavedChanges.retrySaveCancel'),
          dialogProps: {
            transitionShow: 'fade',
            transitionHide: 'fade',
            noBackdropDismiss: true,
            noShake: true,
          },
        } satisfies Partial<InstanceType<typeof ConfirmDialog>['$props']>,
      })
        .onOk(() => {
          resolve(true)
        })
        .onCancel(() => {
          resolve(false)
        })
    })
  }

  async function saveChanges(state: T): Promise<boolean> {
    const saveFn = options.saveState
    if (!saveFn)
      return true

    const trySaving = async (state: T): Promise<boolean> => {
      try {
        saving.value = true
        await options.saveState?.(state)
        return true
      } catch (e) {
        console.error('Error saving changes:', e)
        options.onSaveError?.(e)
        return false
      } finally {
        saving.value = false
      }
    }

    const retryOnSaveFailure = options.retryOnSaveFailure ?? true
    if (retryOnSaveFailure) {
      let saved = await trySaving(state)
      while (!saved) {
        const retry = await promptForRetry()
        if (!retry)
          return false
        saved = await trySaving(state)
      }
      markSaved()
      return true
    } else {
      const saved = await trySaving(state)
      if (saved)
        markSaved()
      return saved
    }
  }

  return {
    saving,
    enabled,
    baseline: readonly(baselineRef),
    getCurrentState,
    hasChanges,
    markSaved,
    createUnsavedChangesGuard,
    saveChanges,
  }
}
