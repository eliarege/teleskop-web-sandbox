import { TbbFtpClient } from 'tbb-ftp-client'
import { EventHandlerRequest, getQuery } from 'h3'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateDigitalInputs } from '~/server/utils/updateDatabase'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)
    const numMachineId = Number.parseInt(machineId)
    if (!Number.isNaN(numMachineId)) {
      const tbb = new TbbFtpClient('192.168.88.202')

      await knex.transaction(async (trx) => {
        await updateAnalogInputs(numMachineId, tbb, trx)
      })
    } else {
      console.log('typeof machineId = ', typeof machineId)
    }
  } catch (err) {
    console.error(err)
  }
})
