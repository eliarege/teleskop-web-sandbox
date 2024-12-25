export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { planKey } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/unplan`

  const unplan = await authFetch(url, {
    query: { planKey },
    method: 'put',
  })
  return unplan
})
