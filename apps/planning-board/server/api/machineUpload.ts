export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { program, machineId, planKey, machineIp, jobOrder } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/upload_joborder`
  const upload = await authFetch(url, {
    method: 'PUT',
    query: { program, machineId, planKey, machineIp, jobOrder },
  })
  return upload
})
