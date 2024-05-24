export default defineEventHandler(async (_event) => {
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/columns/column_data`
  return await $fetch<{ value: string, parameterName: string, planKey?: number }[]>(url)
})
