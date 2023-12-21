import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)

    const tbb = new FTPClient('192.168.88.202')

    const { productModel, hardwareModel, plcModel } = await tbb.fetchControllerModel()

    await knex('BFMACHINES').where('MACHINEID', machineId).update({
      productModel,
      hardwareModel,
      plcModel,
    })
  } catch (err) {
    console.error(err)
  }
})
