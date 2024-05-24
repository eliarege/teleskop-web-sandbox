export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { id, machineId } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/erp_parameters/parameter`
  const erpParameters = await $fetch(url, {
    query: { id, machineId },
    method: 'PUT',
  })
  return erpParameters
})
