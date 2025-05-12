import { getMachineAlarmList } from '../queries'
import type { MachineAlarmList } from '~/shared/types'

export default defineEventHandler(async () => {
  return await getMachineAlarmList() as MachineAlarmList[]
})
