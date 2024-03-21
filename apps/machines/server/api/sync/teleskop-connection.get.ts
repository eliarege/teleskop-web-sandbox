import { TbbFtpClient, withTbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const numMachineId = Number.parseInt(machineId as string)
  if (!Number.isNaN(numMachineId)) {
    const ip = await knex('BFMACHINES')
      .where('MACHINEID', numMachineId)
      .select('IP')
      .first()
      .then(row => row ? row.IP : null)
    try {
      const ftpClient = new TbbFtpClient(ip, { timeout: 1000 })
      await ftpClient.connect()
      ftpClient.close()
    } catch (e) {
      console.error(e)
      throw createError({ statusMessage: 'MACHINE_CONN_FAILED', statusCode: 500 })
    }
  }
})
