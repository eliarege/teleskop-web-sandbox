import type { QueueBasedEvent } from '~/shared/queueBased'

export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { previousEventData, newEventData } = await readBody(event)
  const url = `${config.planningEngineUrl}/queue_based/schedule_events`
  const events = authFetch<QueueBasedEvent[]>(url, {
    method: 'PUT',
    body: { previousEventData, newEventData },
  })
  return events
})
