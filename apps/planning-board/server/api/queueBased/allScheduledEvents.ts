export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const url = `${config.planningEngineUrl}/queue_based/all_scheduled_events`

  const events = await authFetch<{ jobOrder: string, startTime: string }[]>(url)
  return events
})
