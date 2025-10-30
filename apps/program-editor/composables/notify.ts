import { useQuasar } from 'quasar'

export function useNotify() {
  const $q = useQuasar()

  return {
    notifySuccess(message: string) {
      $q.notify({
        message,
        type: 'positive',
        position: 'top',
      })
    },
    notifyError(message: string) {
      $q.notify({
        message,
        type: 'negative',
        position: 'top',
      })
    },
    notifyInfo(message: string) {
      $q.notify({
        message,
        type: 'info',
        position: 'top',
      })
    },
    notifyWarning(message: string) {
      $q.notify({
        message,
        type: 'warning',
        position: 'top',
      })
    },
  }
}
