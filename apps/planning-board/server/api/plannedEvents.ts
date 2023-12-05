import type { PlannedEvents } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { from } = getQuery(event)
  const { to } = getQuery(event)

  const url = `${config.planningEngineUrl}/planned_events`

  const plannedEvents = $fetch<PlannedEvents[]>(url, {
    query: { from, to },
  })
  return plannedEvents
})
