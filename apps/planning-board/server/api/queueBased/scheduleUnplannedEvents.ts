import type { QueueBasedPlannedEvents } from '~/shared/queueBased'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { newEvent } = await readBody(event)
  console.log(newEvent)
  const url = `${config.planningEngineUrl}/queue_based/schedule_unplanned_events`
  const events = $fetch<QueueBasedPlannedEvents[]>(url, {
    method: 'POST',
    body: { newEvent },
  })
  return events
})
