export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { planKey } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/pin_event`
  const pin = authFetch(url, {
    query: { planKey },
    method: 'PUT',
  })
  return pin
})
