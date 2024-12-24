export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/schedule_events`
  const planningBoardUpdate = await authFetch(url, {
    body,
    method: 'PUT',
  })
  return planningBoardUpdate
})
