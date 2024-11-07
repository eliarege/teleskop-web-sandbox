import { getMachineAlarms } from '../queries/alarms'

export default defineEventHandler(async () => {
  return await getMachineAlarms()
})
