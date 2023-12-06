import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const outputs = await tbb.fetchDigitalOutputs()

    const digitalOutputs = outputs?.map(o => ({
      ...o,
      machineId,
    }))

    await knex('BFMACHDOUT').del()
    await knex('BFMACHDOUT').insert(digitalOutputs)

    return digitalOutputs
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
