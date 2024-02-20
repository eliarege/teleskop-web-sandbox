export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { paramId, owner, machineId } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/erp_parameters/add_parameter`
  const erpParameters = await $fetch(url, {
    body: { paramId, owner, machineId },
    method: 'POST',
  })
  return erpParameters
})
