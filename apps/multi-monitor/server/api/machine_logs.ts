import { getMachineLogs } from '../queries'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  return await getMachineLogs(machineId)
})
