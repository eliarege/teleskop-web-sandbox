import { getLastDayAlarmCount } from '../queries'

export default defineEventHandler(async () => {
  const res = await getLastDayAlarmCount()
  return res
})
