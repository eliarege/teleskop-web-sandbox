export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { machineId } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/settings/erp_parameters`
  const erpParameters = await $fetch<{ paramName: string; erpFieldName: string }[]>(url, {
    query: { machineId },
  })
  return erpParameters
})
