import type { PlanParameters } from '~/shared/types'

export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { parameter, value, machineId } = await readBody(event)

  const url = `${config.planningEngineUrl}/planning_board/plan_parameters`
  const planParameters = authFetch<PlanParameters[]>(url, {
    method: 'POST',
    body: { parameter, value, machineId },
  })
  return planParameters
})
