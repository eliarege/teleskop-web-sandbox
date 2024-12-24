import type { MachineStatus } from '~/shared/types'

export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const url = `${config.planningEngineUrl}/planning_board/machines`
  return await authFetch<MachineStatus[]>(url)
})
