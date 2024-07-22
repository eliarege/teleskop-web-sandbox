import type { PlanParameters } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { parameter, value, machineId } = await readBody(event)

  const url = `${config.planningEngineUrl}/planning_board/plan_parameters`
  const planParameters = $fetch<PlanParameters[]>(url, {
    method: 'POST',
    body: { parameter, value, machineId },
  })
  return planParameters
})
