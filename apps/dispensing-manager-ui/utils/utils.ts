import { outlinedCancel, outlinedCheckCircle, outlinedSignalWifiConnectedNoInternet4, outlinedWarning } from '@quasar/extras/material-icons-outlined'
import type { QIconProps } from 'quasar'
import { DispenserConnectionStatus } from '~/shared/constants'

interface ConnectionIcon {
  status: number
  icon: QIconProps
}
export const connectionIcons: Array<ConnectionIcon> = [
  {
    status: DispenserConnectionStatus.connected,
    icon: {
      name: outlinedCheckCircle,
      color: 'green',
    },
  },
  {
    status: DispenserConnectionStatus.notConnected,
    icon: {
      name: outlinedCancel,
      color: 'red',

    },
  },
  {
    status: DispenserConnectionStatus.pathNotAccesible,
    icon: {
      name: outlinedWarning,
      color: 'orange',
    },
  },
  {
    status: DispenserConnectionStatus.serviceUnaccesible,
    icon: {
      name: outlinedSignalWifiConnectedNoInternet4,
      color: 'black',
    },
  },
]
export function getConnectionStatusIcon(status: number): QIconProps | undefined {
  return connectionIcons.find(icon => icon.status === status)?.icon
}
