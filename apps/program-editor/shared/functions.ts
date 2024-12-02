import { Notify } from 'quasar'

export function selectAllCheckboxOnOptionGroup(options: Array<{ value: any }>) {
  if (!options)
    return []
  return options.map(option => option.value)
}

export function removeAllCheckboxOnOptionGroup() {
  return []
}

export function reverseAllCheckboxOnOptionGroup(options: Array<{ value: any }>, model: any[]) {
  if (!options || !model)
    return []
  return options.filter(option => !model.includes(option.value)).map(option => option.value)
}

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
