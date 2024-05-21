import { withTbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, options } = await readBody(event)

  const numMachineId = Number.parseInt(machineId as string)
  if (Number.isNaN(numMachineId)) {
    throw new TypeError('Invalid machineId parameter. Expected number.')
    return
  }

  const ip = await knex('BFMACHINES')
    .select('IP')
    .where('MACHINEID', machineId)
    .first()
    .then(row => row ? row.IP : null)

  await withTbbFtpClient(ip, async (tbb) => {
    await knex.transaction(async (trx) => {
      if (options.machineIdleReasons) {
        await updateStopReasons(tbb, trx)
      }
      if (options.machineFinishReasons) {
        await updateFinishReasons(tbb, trx)
      }
      if (options.users) {
        await updateUsers(tbb, trx)
      }
      if (options.manualReasons) {
        await updateManualReasons(numMachineId, tbb, trx)
      }
    })
  })
})
