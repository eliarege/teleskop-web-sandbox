export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { planKey } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/theoretical_duration`

  const theoreticalDuration = authFetch(url, {
    query: { planKey },
  })
  return theoreticalDuration
})
