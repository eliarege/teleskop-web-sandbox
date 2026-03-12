import { withBase } from 'ufo'
import type { MachineDataRaw } from '~/shared/types'

export default defineEventHandler(async (_event) => {
  const config = useRuntimeConfig()
  const { machineId } = getQuery(_event)
  if (!machineId) {
    const url = withBase(`/api/v1/machine_status`, config.machineStatusUrl)
    const machine = await $fetch<MachineDataRaw[]>(url)
    return machine
  }
  const url = withBase(`/api/v1/machine_status/${machineId}`, config.machineStatusUrl)
  const machine = await $fetch<MachineDataRaw>(url)
  return machine
})
