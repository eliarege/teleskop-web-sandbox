export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { batchKey } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/step-working-times`

  return await authFetch(url, {
    method: 'GET',
    query: { batchKey },
  })
})
