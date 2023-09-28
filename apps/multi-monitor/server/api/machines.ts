import type { MachineDataRaw } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const url = `${config.machineStatusUrl}/api/v1/machine_status`
  const machine = await $fetch<MachineDataRaw[]>(url)
  return machine
})
