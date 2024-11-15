import { getLastDayAlarmCount } from '../queries/alarms'

export default defineEventHandler(async () => {
  const res = await getLastDayAlarmCount()
  return res
})
