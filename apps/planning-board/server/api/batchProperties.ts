export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey, machineId, jobOrder } = getQuery(event)

  const machineStatusUrl = `${config.machineStatusUrl}/api/v1/machine_status`
  const machineStatus = await $fetch<any[]>(machineStatusUrl)
  return machineStatus
})
