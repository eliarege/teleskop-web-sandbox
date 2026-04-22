import { fetchActualStepsWithTheoreticalValuesAtTime } from '~/server/lib/batch-step-resolver'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const query = getQuery(event)

  const timeParam = query.time as string
  if (!timeParam) {
    throw createError({
      statusCode: 400,
      message: 'Missing required query parameter: time',
    })
  }

  const time = new Date(timeParam)
  if (Number.isNaN(time.getTime())) {
    throw createError({
      statusCode: 400,
      message: 'Invalid time format',
    })
  }

  try {
    const result = await fetchActualStepsWithTheoreticalValuesAtTime(batchKey, time)
    return result
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch step details',
    })
  }
})
