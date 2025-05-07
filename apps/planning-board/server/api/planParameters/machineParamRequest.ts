import type { PlanParameters } from '~/shared/types'

export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const url = `${config.planningEngineUrl}/planning_board/plan_parameters/machine_request`
  const machineParamRequest = authFetch(url)

  return machineParamRequest
})
