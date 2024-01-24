import type { QueueBasedPlannedEvents } from '~/shared/queueBased'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const url = `${config.planningEngineUrl}/queue_based/scheduled_events`

  const plannedEvents = $fetch<QueueBasedPlannedEvents[]>(url)
  return plannedEvents
})
