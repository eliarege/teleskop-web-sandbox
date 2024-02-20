export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { paramId, owner, machineId } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/erp_parameters/parameter`
  const erpParameters = await $fetch(url, {
    query: { paramId, owner, machineId },
    method: 'DELETE',
  })
  return erpParameters
})
