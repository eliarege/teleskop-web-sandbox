import { useQuasar } from 'quasar'

export default function useNotify() {
  const q = useQuasar()
  const { t } = useI18n()

  function notifySuccess(message: string) {
    q.notify({
      message,
      position: 'top',
      timeout: 2000,
      actions: [
        { label: t('dismiss'), color: 'blue', handler: () => {} },
      ],
    })
  }

  function notifyError(message: string) {
    q.notify({
      message,
      position: 'top',
      timeout: 2000,
      actions: [
        { label: t('dismiss'), color: 'red', handler: () => {} },
      ],
    })
  }

  return { notifySuccess, notifyError }
}
