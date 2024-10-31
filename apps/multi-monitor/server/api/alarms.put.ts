import { updateMachineAlarms } from '../queries/alarms'
import type { MachineAlarm } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await updateMachineAlarms(body.machineId, body.commandNo, body.alarmNo)
})
