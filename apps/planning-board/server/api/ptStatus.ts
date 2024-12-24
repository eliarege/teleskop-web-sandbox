export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const url = `${config.planningEngineUrl}/planning_board/state`
  const ptState = authFetch<string>(url)
  return ptState
})
