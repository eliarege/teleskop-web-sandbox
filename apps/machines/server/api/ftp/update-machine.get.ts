import { TbbFtpClient } from 'tbb-ftp-client'
import { EventHandlerRequest, getQuery } from 'h3'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateCommandAlarmReasons, updateCommandAlarms, updateCommandIO, updateCommandParameters, updateConsumption, updateDigitalInputs, updateGlobalCommandFormulas, updateLocksGeneral } from '~/server/utils/updateDatabase'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)
    const numMachineId = Number.parseInt(machineId as string)
    let res
    if (!Number.isNaN(numMachineId)) {
      const tbb = new TbbFtpClient('192.168.88.202')
      return await tbb.fetchLocksInput()
      /*       await knex.transaction(async (trx) => {
        res = await updateLocksGeneral(numMachineId, tbb, trx)
      })
 */
    } else {
      console.log('typeof machineId = ', typeof machineId)
    }
    return res
  } catch (err) {
    console.error(err)
  }
})
