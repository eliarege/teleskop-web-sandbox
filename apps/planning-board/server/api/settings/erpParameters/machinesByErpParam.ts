import type { MachineStatus } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { paramString } = getQuery(event)
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/settings/machines_by_erp_parameter`
  return await $fetch<MachineStatus[]>(url, {
    query: { paramString },
  })
})
