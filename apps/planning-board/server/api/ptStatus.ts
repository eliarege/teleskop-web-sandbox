export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/state`
  const ptState = $fetch<string>(url)
  return ptState
})
