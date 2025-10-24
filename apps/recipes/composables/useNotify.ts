interface NotificationOptions {
  timeout?: number
  icon?: string
  color?: string
  textColor?: string
  redirect?: string
}

interface Notify {
  notifySuccess: (message: string, options?: NotificationOptions) => void
  notifyFail: (message: string, options?: NotificationOptions) => void
}

export default function useNotify(): Notify {
  const q = useQuasar()

  const notifySuccess = (message: string, options: NotificationOptions = {}) => {
    const { timeout = 3000, icon = 'done', color = 'green-4', textColor = 'white', redirect } = options
    q.notify({
      color,
      textColor,
      icon,
      timeout,
      message: redirect
        ? `<a href="${redirect}" style="color: blue; text-decoration: underline;">${message}</a>`
        : message,
      html: !!redirect,
    })
  }

  const notifyFail = (message: string, options: NotificationOptions = {}) => {
    const { timeout = 3000, icon = 'cancel', color = 'red', textColor = 'white', redirect } = options
    q.notify({
      color,
      textColor,
      icon,
      timeout,
      message: redirect
        ? `<a href="${redirect}" style="color: blue; text-decoration: underline;">${message}</a>`
        : message,
      html: !!redirect,
    })
  }

  return {
    notifySuccess,
    notifyFail,
  }
}
