import { getActiveAnalogIoValues, getArchivedBatchIoValues, getCounters, isBatchActive } from '~/server/functions/io'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const isActive = await isBatchActive(batchKey)

  if (isActive === null) {
    throw createError({
      statusCode: 404,
      message: 'Batch not found',
    })
  }

  const analogValues = isActive
    ? await getActiveAnalogIoValues(batchKey, { type: IOType.Counter })
    : (await getArchivedBatchIoValues(batchKey)).analogValues

  const counters = await getCounters(batchKey, analogValues)

  return counters
})
