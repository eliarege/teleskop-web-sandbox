export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { id, machineId } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/erp_parameters/add_parameter`
  const erpParameters = await authFetch(url, {
    body: { id, machineId },
    method: 'POST',
  })
  return erpParameters
})
