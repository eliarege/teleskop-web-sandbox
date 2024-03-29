export default defineEventHandler(async (_event) => {
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/settings/erp_parameters/distinct`
  const erpParameters = await $fetch<{ paramName: string }[]>(url)
  return erpParameters
})
