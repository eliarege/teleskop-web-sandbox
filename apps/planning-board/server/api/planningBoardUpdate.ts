export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { updatedEvent } = getQuery(event)
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/scheduled_events/update`
  const planningBoardUpdate = await $fetch(url, {
    query: { updatedEvent },
    body,
    method: 'PUT',
  })
  return planningBoardUpdate
})
