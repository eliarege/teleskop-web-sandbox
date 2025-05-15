import { getMachineAlarms } from '../queries'

export default defineEventHandler(async () => {
  return await getMachineAlarms()
})
