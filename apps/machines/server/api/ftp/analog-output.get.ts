import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const outputs = await tbb.fetchAnalogOutputs()
    const analogOutputs = outputs?.map(i => ({
      ...i,
      machineId,
    }))

    await knex('BFMACHAOUT').del()
    await knex('BFMACHAOUT').where('MACHINEID', machineId).insert(analogOutputs)

    return analogOutputs
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
