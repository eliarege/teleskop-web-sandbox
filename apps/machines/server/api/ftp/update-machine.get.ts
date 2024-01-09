import { TbbFtpClient, withTbbFtpClient } from 'tbb-ftp-client'
import { EventHandlerRequest, getQuery } from 'h3'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateCommandAlarmReasons, updateCommandAlarms, updateCommandIO, updateCommandParameters, updateConsumption, updateDigitalInputs, updateGlobalCommandFormulas, updateLocksGeneral, writeFinishReasons, writeGlobalCommandFormulas, writeManualReasons, writeStopReasons, writeUsers } from '~/server/utils/updateDatabase'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const numMachineId = Number.parseInt(machineId as string)
  let res
  if (!Number.isNaN(numMachineId)) {
    await withTbbFtpClient('192.168.88.202', async (tbb) => {
      await knex.transaction(async (trx) => {
        res = await writeGlobalCommandFormulas(numMachineId, tbb, trx)
      })
    })
  } else {
    console.log('typeof machineId = ', typeof machineId)
  }
  return res
})
