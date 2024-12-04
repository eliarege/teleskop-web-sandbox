import { Notify } from 'quasar'
import type { MachineInfo } from './types'

export function selectAllCheckboxOnOptionGroup(options: MachineInfo[]): MachineInfo[] {
  if (!options)
    return []
  return options
}

export function removeAllCheckboxOnOptionGroup() {
  return []
}

export function reverseAllCheckboxOnOptionGroup(options: MachineInfo[], model: MachineInfo[]): MachineInfo[] {
  if (!options || !model)
    return []
  return options.filter(option => !model.some(m => m.id === option.id))
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
