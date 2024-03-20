interface NotificationOptions {
  timeout?: number
  icon?: string
  color?: string
  textColor?: string
}

interface Notify {
  notifySuccess: (message: string, options?: NotificationOptions) => void
  notifyFail: (message: string, options?: NotificationOptions) => void
}

export default function useNotify(): Notify {
  const q = useQuasar()

  const notifySuccess = (message: string, options: NotificationOptions = {}) => {
    const { timeout = 3000, icon = 'done', color = 'green-4', textColor = 'white' } = options
    q.notify({
      color,
      textColor,
      icon,
      message,
      timeout,
    })
  }

  const notifyFail = (message: string, options: NotificationOptions = {}) => {
    const { timeout = 3000, icon = 'cancel', color = 'red', textColor = 'white' } = options
    q.notify({
      color,
      textColor,
      icon,
      message,
      timeout,
    })
  }

  return {
    notifySuccess,
    notifyFail,
  }
}
