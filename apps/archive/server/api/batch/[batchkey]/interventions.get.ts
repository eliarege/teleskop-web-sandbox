import { getInterventions } from '~/server/functions/etc'
import { getSinceQuery } from '~/server/utils/functions'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const since = getSinceQuery(event)
  const interventions = await getInterventions(batchKey, since)
  return interventions
})
