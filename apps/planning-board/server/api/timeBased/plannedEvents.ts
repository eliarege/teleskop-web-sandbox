import type { TimeBasedEventStates } from '~/shared/timeBased'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { archiveDays } = getQuery(event)
  const url = `${config.planningEngineUrl}/time_based/scheduled_events`

  const plannedEvents = $fetch<TimeBasedEventStates>(url, {
    query: { archiveDays },
  })
  return plannedEvents
})
