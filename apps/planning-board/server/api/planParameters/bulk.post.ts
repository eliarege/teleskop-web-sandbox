import type { PlanParameters } from '~/shared/types'

interface BulkUpdateRequest {
  planKey: number
  machineId: number
  parameters: Array<{
    parameter: PlanParameters
    value: number
  }>
}

export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { planKey, machineId, parameters } = await readBody<BulkUpdateRequest>(event)

  const url = `${config.planningEngineUrl}/planning_board/plan_parameters/bulk`

  const planParameters = authFetch<PlanParameters[]>(url, {
    method: 'POST',
    body: { planKey, machineId, parameters },
  })

  return planParameters
})
