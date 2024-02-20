import type { MachineStatus } from '~/shared/types'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/machines`
  return await $fetch<MachineStatus[]>(url)
})
