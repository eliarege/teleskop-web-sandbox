import type { MachineStatus } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const machineStatusUrl = `${config.machineStatusUrl}/api/v1/machine_status`
  const machineStatus = await $fetch<MachineStatus[]>(machineStatusUrl)
  return machineStatus
})
