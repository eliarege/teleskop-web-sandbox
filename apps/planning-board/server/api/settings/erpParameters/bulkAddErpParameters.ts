export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { paramString, machines } = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/erp_parameters/bulk_add_parameter`
  const erpParameters = await authFetch(url, {
    body: { paramString, machines },
    method: 'PUT',
  })
  return erpParameters
})
