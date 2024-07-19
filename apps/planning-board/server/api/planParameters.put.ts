import type { PlanParameters } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey, value, paramString } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/plan_parameters`
  const planParameters = $fetch<PlanParameters[]>(url, {
    method: 'PUT',
    query: { planKey, value, paramString },
  })
  return planParameters
})
