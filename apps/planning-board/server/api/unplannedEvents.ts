import type { QueueBasedNonActualEvent } from '~/shared/queueBased'

export default defineAuthEventHandler(async (event) => {
  const authFetch = useKcFetch(event)
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/unscheduled_events`

  const unplannedEvents = await authFetch<QueueBasedNonActualEvent[]>(url)
  return unplannedEvents
})
