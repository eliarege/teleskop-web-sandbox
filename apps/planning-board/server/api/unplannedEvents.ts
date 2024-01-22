import type { UnplannedEventsRaw } from '~/shared/types'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/unscheduled_events`

  const unplannedEvents = $fetch<UnplannedEventsRaw[]>(url)
  return unplannedEvents
})
