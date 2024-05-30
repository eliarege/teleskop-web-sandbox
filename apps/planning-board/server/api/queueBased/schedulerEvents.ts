import type { QueueBasedEvents } from '~/shared/queueBased'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { startDate, endDate } = getQuery(event)
  const url = `${config.planningEngineUrl}/queue_based/scheduler_events`

  const events = $fetch<QueueBasedEvents[]>(url, {
    query: { startDate, endDate },
  })
  return events
})
