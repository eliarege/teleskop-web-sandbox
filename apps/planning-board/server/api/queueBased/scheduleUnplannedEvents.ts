export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { newEvent } = await readBody(event)
  const url = `${config.planningEngineUrl}/queue_based/schedule_unplanned_events`
  const events = authFetch(url, {
    method: 'POST',
    body: { newEvent },
  })
  return events
})
