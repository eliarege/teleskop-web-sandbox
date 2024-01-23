import type { PlannedEvents } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const url = `${config.planningEngineUrl}/time_based/scheduled_events`

  const plannedEvents = $fetch<PlannedEvents[]>(url)
  return plannedEvents
})
