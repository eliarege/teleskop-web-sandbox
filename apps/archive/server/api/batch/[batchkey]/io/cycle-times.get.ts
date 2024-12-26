import { getActiveReelCycleTimes, getArchivedBatchIoValues, getReels, isBatchActive } from '~/server/functions/io'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const isActive = await isBatchActive(batchKey)

  if (isActive === null) {
    throw createError({
      statusCode: 404,
      message: 'Batch not found',
    })
  }

  const cycleTimes = isActive
    ? await getActiveReelCycleTimes(batchKey)
    : (await getArchivedBatchIoValues(batchKey)).cycleTimes

  const reels = await getReels(batchKey, cycleTimes)

  return reels
})
