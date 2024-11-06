import { updateMachineAlarmVisibility } from '../queries/alarms'

// TODO: Body validation
// Maybe queries can be executed in routes
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await updateMachineAlarmVisibility(body.machineId, body.commandNo, body.alarmNo, body.showOnScreen)
})
