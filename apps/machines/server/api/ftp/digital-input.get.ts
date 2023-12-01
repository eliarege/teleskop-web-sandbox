import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const inputs = await tbb.fetchDigitalInputs()
    const digitalInputs = inputs?.map(i => ({
      ...i,
      machineId,
    }))

    await knex('BFMACHDIN').del()
    await knex('BFMACHDIN').insert(digitalInputs)

    return digitalInputs
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
