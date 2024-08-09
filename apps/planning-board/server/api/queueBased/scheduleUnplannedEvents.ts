export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { newEvent } = await readBody(event)
  const url = `${config.planningEngineUrl}/queue_based/schedule_unplanned_events`
  const events = $fetch(url, {
    method: 'POST',
    body: { newEvent },
  })
  return events
})
