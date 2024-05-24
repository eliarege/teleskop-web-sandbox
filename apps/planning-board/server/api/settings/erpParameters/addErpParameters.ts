export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { id, machineId } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/erp_parameters/add_parameter`
  const erpParameters = await $fetch(url, {
    body: { id, machineId },
    method: 'POST',
  })
  return erpParameters
})
