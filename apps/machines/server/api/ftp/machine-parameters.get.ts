import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const machineParameters = await tbb.fetchMachineParameters()

    // await knex('BFMACHPARAMETERS').del()
    // await knex('BFMACHPARAMETERS').insert(machineParameters)

    return machineParameters
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
