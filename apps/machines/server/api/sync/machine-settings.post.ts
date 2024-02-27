import { withTbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machines, settings } = await readBody(event)

  let system

  const numMachineIds = machines.map(machineId => Number.parseInt(machineId as string))

  const ips = await knex('BFMACHINES')
    .select('IP')
    .whereIn('MACHINEID', numMachineIds)
    .then(arr => arr.map(obj => obj.IP))

  for (const ip of ips) {
    await withTbbFtpClient(ip, async (tbb) => {
      system = await tbb.fetchSystemParams()
      settings.forEach((newSetting) => {
        if (system[newSetting.caption]) {
          system[newSetting.caption] = newSetting.isActive ? '1' : '0'
        }
      })
      await tbb.uploadSystemParams(system)
    })
  }
})
