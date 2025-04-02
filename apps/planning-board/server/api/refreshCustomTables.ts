export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)

  const url = `${config.planningEngineUrl}/planning_board/refresh_tables`
  return await authFetch(url, {
    method: 'PUT',
  })
})
