import { Notify } from 'quasar'

export function notification(isSuccess: any, message: string, group?: string) {
  const notificationState = useNotificationStore()
  notificationState.notifications.push({ message, type: isSuccess ? 'positive' : 'warning', date: new Date() })

  Notify.create({
    message,
    group,
    type: isSuccess ? 'positive' : 'warning',
    position: 'top',
  })
}
