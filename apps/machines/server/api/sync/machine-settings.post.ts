import { withTbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machines, settings } = await readBody(event)

  // TODO: add support for multiple machines
  const machineId = machines[0]
  let system

  const numMachineId = Number.parseInt(machineId as string)
  if (Number.isNaN(numMachineId)) {
    console.log('Invalid machineId:', machineId)
    return
  }

  const ip = await knex('BFMACHINES')
    .select('IP')
    .where('MACHINEID', machineId)
    .first()
    .then(row => row ? row.IP : null)

  await withTbbFtpClient(ip, async (tbb) => {
    await knex.transaction(async (trx) => {
      system = await tbb.fetchSystem()
      settings.forEach((newSetting) => {
        if (system[newSetting.caption]) {
          system[newSetting.caption] = newSetting.isActive ? '1' : '0'
        }
      })
      await tbb.uploadSystem(system)
    })
  })
})
