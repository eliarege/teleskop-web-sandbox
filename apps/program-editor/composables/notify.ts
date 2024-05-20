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
  }
}
