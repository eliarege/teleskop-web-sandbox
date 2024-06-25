export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/plan_parameters`
  const planParameters = $fetch<{ id: number, paramString: string, value: string | number, unitCode: number }[]>(url, {
    query: { planKey },
  })
  return planParameters
})
