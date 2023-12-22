export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/plan_parameters`
  const planParameters = $fetch(url, {
    query: { planKey },
  })
  return planParameters
})
