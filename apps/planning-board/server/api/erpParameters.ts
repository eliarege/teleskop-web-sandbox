export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { machineId } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/settings/erp_parameters`
  const erpParameters = await $fetch<{ definitions: any[]; plannedDefinitions: any[]; unplannedDefinitions: any[] }>(url, {
    query: { machineId },
  })
  return erpParameters
})
