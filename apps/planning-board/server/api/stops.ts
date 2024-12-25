import type { MachineStatus } from '~/shared/types'

export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { startDate, endDate } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/stops`
  return await authFetch<any[]>(url, {
    query: { startDate, endDate },
  })
})
