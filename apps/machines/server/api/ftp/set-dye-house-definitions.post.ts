import { withTbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, options } = await readBody(event)

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
      if (options.machineIdleReasons) {
        await writeStopReasons(tbb, trx)
      }
      if (options.machineFinishReasons) {
        await writeFinishReasons(tbb, trx)
      }
      if (options.users) {
        await writeUsers(tbb, trx)
      }
      if (options.manualReasons) {
        await WriteManualReasons(tbb, trx)
      }
      // TODO: add write commandTimeoutReasons
      /*       if (options.commandTimeoutReasons) {
        await updateManualReasons(tbb, trx)
      } */
    })
  })
})
