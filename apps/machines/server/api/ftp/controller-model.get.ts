import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const { machineId } = getQuery(event)

    const tbb = new TBB6500FtpClient('192.168.88.202')

    const { ProductModel, HardwareModel, PlcModel } = await tbb.fetchControllerModel()

    await knex('BFMACHINES').where('MACHINEID', machineId).update({
      ProductModel,
      HardwareModel,
      PlcModel,
    })
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
