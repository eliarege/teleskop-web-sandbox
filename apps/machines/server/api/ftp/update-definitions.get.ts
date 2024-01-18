import { withTbbFtpClient } from 'tbb-ftp-client'
import { getQuery } from 'h3'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, ip } = getQuery(event)
  const numMachineId = Number.parseInt(machineId as string)
  let res
  if (!Number.isNaN(numMachineId)) {
    await withTbbFtpClient(ip, async (tbb) => {
      await knex.transaction(async (trx) => {
        // stop
        await updateStopReasons(tbb, trx)
        // finish
        await updateFinishReasons(tbb, trx)
        // users
        await updateUsers(tbb, trx)
      })
    })
  } else {
    console.log('typeof machineId = ', typeof machineId)
  }
  return res
})
