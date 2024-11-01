import type Ref from 'vue'
import { Notify } from 'quasar'

export function selectAllCheckboxOnOptionGroup(optionsRef: { value: any }[]) {
  const result: any[] = []
  optionsRef.forEach((option) => {
    result.push(option.value)
  })
  return result
}

export function removeAllCheckboxOnOptionGroup() {
  const result: any[] = []
  return result
}

export function reverseAllCheckboxOnOptionGroup(options: { value: any }[], modelValue: any[]) {
  const result: any[] = []
  options.forEach((option) => {
    if (!modelValue.includes(option.value)) {
      result.push(option.value)
    }
  })
  return result
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
