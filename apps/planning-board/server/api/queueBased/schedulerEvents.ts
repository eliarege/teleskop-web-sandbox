import type { QueueBasedEvent } from '~/shared/queueBased'

export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { startDate, endDate, includeStops } = getQuery(event)
  const url = `${config.planningEngineUrl}/queue_based/scheduler_events`

  const events = await authFetch<QueueBasedEvent[]>(url, {
    query: { startDate, endDate, includeStops },
  })
  // await new Promise(resolve => setTimeout(resolve, 2000))
  return events
})
