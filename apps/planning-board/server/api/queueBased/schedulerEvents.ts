import type { QueueBasedEvent } from '~/shared/queueBased'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { startDate, endDate, includeStops } = getQuery(event)
  const url = `${config.planningEngineUrl}/queue_based/scheduler_events`

  const events = await $fetch<QueueBasedEvent[]>(url, {
    query: { startDate, endDate, includeStops },
  })
  return events
})
