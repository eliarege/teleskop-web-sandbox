export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey, machineId } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/theoretical_duration`

  const theoreticalDuration = $fetch(url, {
    query: { planKey, machineId },
  })
  return theoreticalDuration
})
