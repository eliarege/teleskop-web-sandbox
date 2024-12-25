export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { planKey } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/unpin_event`
  const pin = await authFetch(url, {
    query: { planKey },
    method: 'PUT',
  })
  return pin
})
