import type { UnplannedEventsRaw } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { from } = getQuery(event)
  const { to } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/unscheduled_events`

  const unplannedEvents = $fetch<UnplannedEventsRaw[]>(url, {
    query: { from, to },
  })
  return unplannedEvents
})
