export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const url = `${config.planningEngineUrl}/planning_board/columns/unplanned_columns`
  return await authFetch<{ id: number, parameterId: number, parameterName: string, visible: boolean }[]>(url)
})
