import { QueueBasedNonActualEvent } from '~/shared/queueBased'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/unscheduled_events`

  const unplannedEvents = await $fetch<QueueBasedNonActualEvent[]>(url)
  return unplannedEvents
})
