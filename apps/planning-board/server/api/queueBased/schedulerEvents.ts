import type { QueueBasedAnyEvent } from '~/shared/queueBased'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { startDate, endDate, includeStops } = getQuery(event)
  const url = `${config.planningEngineUrl}/queue_based/scheduler_events`

  const events = $fetch<QueueBasedAnyEvent[]>(url, {
    query: { startDate, endDate, includeStops },
  })
  return events
})
