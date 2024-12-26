import { getActiveDigitalIoValues, getArchivedBatchIoValues, getDigitalOutputs, isBatchActive } from '~/server/functions/io'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const isActive = await isBatchActive(batchKey)

  if (isActive === null) {
    throw createError({
      statusCode: 404,
      message: 'Batch not found',
    })
  }

  const digitalValues = isActive
    ? await getActiveDigitalIoValues(batchKey)
    : (await getArchivedBatchIoValues(batchKey)).digitalValues

  const digitalOutputs = await getDigitalOutputs(batchKey, digitalValues)

  return digitalOutputs
})
