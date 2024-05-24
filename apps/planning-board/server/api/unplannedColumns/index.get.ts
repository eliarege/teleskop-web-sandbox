export default defineEventHandler(async (_event) => {
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/columns/unplanned_columns`
  return await $fetch<{ id: number, parameterId: number, parameterName: string, visible: boolean }[]>(url)
})
