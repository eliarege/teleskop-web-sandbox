import type { MachineStatus } from '~/shared/types'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const machineStatusUrl = `${config.machineStatusUrl}/api/v1/machine_status`
  return await $fetch<MachineStatus[]>(machineStatusUrl)
})
