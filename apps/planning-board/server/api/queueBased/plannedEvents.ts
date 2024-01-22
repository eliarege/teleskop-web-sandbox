import type { PlannedEvents } from '~/shared/types'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const url = `${config.planningEngineUrl}/queue_based/scheduled_events`

  const plannedEvents = $fetch<PlannedEvents[]>(url)
  return plannedEvents
})
