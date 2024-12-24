export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey, fabricWeight } = getQuery(event)
  const authFetch = useKcFetch(event)

  const url = `${config.planningEngineUrl}/planning_board/valid`

  const isValid = authFetch(url, {
    query: { planKey, fabricWeight },
  })
  return isValid
})
