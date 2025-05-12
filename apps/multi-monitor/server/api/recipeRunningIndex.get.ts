import { getCurrentRunningIndex } from '../queries'

export default defineEventHandler(async (event) => {
  const { batchKey } = getQuery(event)
  const response = await getCurrentRunningIndex(batchKey)
  return response
})
