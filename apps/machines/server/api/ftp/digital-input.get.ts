import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const digitalInputs = await tbb.fetchDigitalInputs()

    console.log('digitalInputs = ', digitalInputs)
    // await knex('BFMACHDIN').del()
    // await knex('BFMACHDIN').insert(digitalInputs)

    return digitalInputs
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
