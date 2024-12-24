export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const url = `${config.planningEngineUrl}/planning_board/columns/column_data`
  return await authFetch<{ value: string, parameterName: string, planKey?: number }[]>(url)
})
