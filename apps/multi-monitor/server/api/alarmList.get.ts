import { getMachineAlarmList } from '../queries'
import type { MachineAlarmList } from '~/shared/types'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  return await getMachineAlarmList(config.timezoneOffset) as MachineAlarmList[]
})
