import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const analogOutputs = await tbb.fetchAnalogOutputs()

    // await knex('BFMACHAOUT').del()
    // await knex('BFMACHAOUT').insert(analogInputs)

    return analogOutputs
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
