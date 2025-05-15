export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)

  const url = `${config.planningEngineUrl}/planning_board/data_cleanup`
  const dataCleanup = await authFetch(url, {
    method: 'PUT',
  })
  return dataCleanup
})
