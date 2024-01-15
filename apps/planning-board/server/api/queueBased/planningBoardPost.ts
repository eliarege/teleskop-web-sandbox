export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { updatedEvent } = getQuery(event)
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/queue_based/unscheduled_events/schedule`
  const planningBoardUpdate = await $fetch(url, {
    query: { updatedEvent },
    body,
    method: 'POST',
  })
  return planningBoardUpdate
})
