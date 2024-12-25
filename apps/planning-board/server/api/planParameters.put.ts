import type { PlanParameters } from '~/shared/types'

export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { planKey, value, paramString } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/plan_parameters`
  const planParameters = authFetch<PlanParameters[]>(url, {
    method: 'PUT',
    query: { planKey, value, paramString },
  })
  return planParameters
})
