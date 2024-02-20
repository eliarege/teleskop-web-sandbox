export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { machineId, planKey } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/event_tooltip`
  const tooltipParameters = await $fetch(url, {
    query: { machineId, planKey },
  })
  return tooltipParameters
})
