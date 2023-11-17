import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const analogInputs = await tbb.fetchAnalogInputs()

    // await knex('BFMACHAIN').del()
    // await knex('BFMACHAIN').insert(analogInputs)

    return analogInputs
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
