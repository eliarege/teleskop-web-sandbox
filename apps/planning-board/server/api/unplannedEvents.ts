import type { UnplannedEventsRaw } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { from } = getQuery(event)
  const { to } = getQuery(event)

  const url = `${config.planningEngineUrl}/unplanned_events`

  const unplannedEvents = $fetch<UnplannedEventsRaw[]>(url, {
    query: { from, to },
  })
  return unplannedEvents
})
