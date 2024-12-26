import { getActiveDigitalIoValues, getArchivedBatchIoValues, getDigitalInputs, isBatchActive } from '~/server/functions/io'

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

  const digitalInputs = await getDigitalInputs(batchKey, digitalValues)

  return digitalInputs
})
