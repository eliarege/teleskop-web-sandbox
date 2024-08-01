import { withTbbFtpClient } from '@teleskop/tbb-ftp-client'
import { knex } from '~/server/connectionPool'
import type { Setting } from '~/types'

export default defineEventHandler(async (event) => {
  const { machines, settings } = await readBody(event)

  let system: Record<string, string> = {}

  const numMachineIds = machines.map((machineId: string) => Number.parseInt(machineId))

  const ips = await knex('BFMACHINES')
    .select('IP')
    .whereIn('MACHINEID', numMachineIds)
    .then(arr => arr.map(obj => obj.IP))

  for (const ip of ips) {
    await withTbbFtpClient(ip, async (tbb) => {
      system = await tbb.fetchSystemParams()
      settings.forEach((newSetting: Setting) => {
        if (system[newSetting.caption]) {
          system[newSetting.caption] = newSetting.isActive ? '1' : '0'
        }
      })
      await tbb.uploadSystemParams(system)
    })
  }
})
