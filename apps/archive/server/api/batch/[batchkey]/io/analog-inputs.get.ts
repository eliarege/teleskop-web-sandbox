import { getActiveAnalogIoValues, getAnalogInputs, getArchivedBatchIoValues, isBatchActive } from '~/server/functions/io'
import { getBatchKeyParam } from '~/server/utils/functions'

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
    ? await getActiveAnalogIoValues(batchKey, { type: IOType.AnalogInput })
    : (await getArchivedBatchIoValues(batchKey)).analogValues

  const analogInputs = await getAnalogInputs(batchKey, analogValues)

  return analogInputs
})
