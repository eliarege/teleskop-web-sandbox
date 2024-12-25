export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { machineId, planKey } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/event_tooltip`
  const tooltipParameters = await authFetch(url, {
    query: { machineId, planKey },
  })
  return tooltipParameters
})
