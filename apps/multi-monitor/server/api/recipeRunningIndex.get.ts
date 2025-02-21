import { getCurrentRunningIndex } from '../queries/currentRunningIndex'

export default defineEventHandler(async (event) => {
  const { batchKey } = getQuery(event)
  const response = await getCurrentRunningIndex(batchKey)
  return response
})
