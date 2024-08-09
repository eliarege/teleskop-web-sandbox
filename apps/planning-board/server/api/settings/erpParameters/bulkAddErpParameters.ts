export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { paramString, machines } = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/erp_parameters/bulk_add_parameter`
  const erpParameters = await $fetch(url, {
    body: { paramString, machines },
    method: 'PUT',
  })
  return erpParameters
})
