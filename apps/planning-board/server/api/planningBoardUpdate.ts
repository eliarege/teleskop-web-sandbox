export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/schedule_events`
  const planningBoardUpdate = await $fetch(url, {
    body,
    method: 'PUT',
  })
  return planningBoardUpdate
})
