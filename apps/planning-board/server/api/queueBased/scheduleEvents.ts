import type { QueueBasedEvents } from '~/shared/queueBased'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { previousEventData, newEventData } = await readBody(event)
  const url = `${config.planningEngineUrl}/queue_based/schedule_events`
  const events = $fetch<QueueBasedEvents[]>(url, {
    method: 'PUT',
    body: { previousEventData, newEventData },
  })
  return events
})
