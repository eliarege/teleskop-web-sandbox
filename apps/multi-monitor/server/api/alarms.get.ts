import { getMachineAlarms } from '../queries/alarms'
import type { MachineAlarm } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const res = await getMachineAlarms()
  return JSON.parse(res[0].result) as MachineAlarm[]
})
