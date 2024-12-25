import type { TimeBasedEventStates } from '~/shared/timeBased'

export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { archiveDays } = getQuery(event)
  const url = `${config.planningEngineUrl}/time_based/scheduled_events`

  const plannedEvents = await authFetch<TimeBasedEventStates>(url, {
    query: { archiveDays },
  })
  return plannedEvents
})
