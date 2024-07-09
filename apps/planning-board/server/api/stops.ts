import type { MachineStatus } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { startDate, endDate } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/stops`
  return await $fetch<any[]>(url, {
    query: { startDate, endDate },
  })
})
