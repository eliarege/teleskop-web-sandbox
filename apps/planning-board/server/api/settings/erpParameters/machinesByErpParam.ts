import type { MachineStatus } from '~/shared/types'

export default defineAuthEventHandler(async (event) => {
  const authFetch = useKcFetch(event)
  const { paramString } = getQuery(event)
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/settings/machines_by_erp_parameter`
  return await authFetch<MachineStatus[]>(url, {
    query: { paramString },
  })
})
