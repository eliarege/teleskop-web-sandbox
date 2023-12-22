import { TbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const values = await knex('BFMACHPARAMETERS').where('MACHINEID', machineId).select({
      id: 'MACHINEPARAMETERID',
      currentValue: 'currentValue',
    })

    const tbb = new TbbFtpClient('192.168.88.202')
    // await tbb.writeMachineParameterValues(values)
    return values
  } catch (err) {
    console.error(err)
  }
})
