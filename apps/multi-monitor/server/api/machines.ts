import { withBase } from 'ufo'
import type { MachineDataRaw } from '~/shared/types'

export default defineEventHandler(async (_event) => {
  const config = useRuntimeConfig()
  const url = withBase(`/api/v1/machine_status`, config.machineStatusUrl)
  const machine = await $fetch<MachineDataRaw[]>(url)
  return machine
})
