import { withTbbFtpClient } from '@teleskop/tbb-ftp-client'
import { knex } from '~/server/connectionPool'
import { writeCommandAlarmReasons, writeManualReasonsGeneral } from '~/server/utils/updateDatabase'

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
        await writeStopReasons(tbb, trx)
      }
      if (options.machineFinishReasons) {
        await writeFinishReasons(tbb, trx)
      }
      if (options.users) {
        await writeUsers(machineId, tbb, trx)
      }
      if (options.manualReasons) {
        await writeManualReasonsGeneral(tbb, trx)
      }
      if (options.commandTimeoutReasons) {
        await writeCommandAlarmReasons(machineId, tbb, trx)
      }
    })
  })
})
