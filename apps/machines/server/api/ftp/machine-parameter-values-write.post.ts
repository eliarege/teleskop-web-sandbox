import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = await getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const values = await knex('BFMACHPARAMETERS').where('MACHINEID', machineId).select({
      id: 'MACHINEPARAMETERID',
      currentValue: 'currentValue',
    })

    const tbb = new TBB6500FtpClient('192.168.88.202')
    await tbb.writeMachineParameterValues(values)
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
