export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { program, machineId, planKey, machineIp, jobOrder } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/upload_joborder`
  const upload = await $fetch(url, {
    method: 'PUT',
    query: { program, machineId, planKey, machineIp, jobOrder },
  })
  return upload
})
