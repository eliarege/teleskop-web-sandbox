import { Notify } from 'quasar'

export function useNotify() {
  return {
    notifySuccess(message: string) {
      Notify.create({
        message,
        type: 'positive',
        position: 'top',
      })
    },
    notifyError(message: string) {
      Notify.create({
        message,
        type: 'negative',
        position: 'top',
      })
    },
    notifyInfo(message: string) {
      Notify.create({
        message,
        type: 'info',
        position: 'top',
      })
    },
    notifyWarning(message: string) {
      Notify.create({
        message,
        type: 'warning',
        position: 'top',
      })
    },
  }
}
