import { TbbFtpClient, withTbbFtpClient } from 'tbb-ftp-client'
import { EventHandlerRequest, getQuery } from 'h3'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateCommandAlarmReasons, updateCommandAlarms, updateCommandIO, updateCommandParameters, updateConsumption, updateDigitalInputs, updateGlobalCommandFormulas, updateLocksGeneral, writeFinishReasons, writeGlobalCommandFormulas, writeManualReasons, writeStopReasons, writeUsers } from '~/server/utils/updateDatabase'

export default defineEventHandler(async (event) => {
  const { machineId, ip } = getQuery(event)
  const numMachineId = Number.parseInt(machineId as string)
  let res
  if (!Number.isNaN(numMachineId)) {
    await withTbbFtpClient(ip, async (tbb) => {
      await knex.transaction(async (trx) => {
        // controllerModel
        await updateMachineController(numMachineId, tbb, trx)
        // baslatmaparametreleri

        // commandGroup
        await updateCommandGroups(numMachineId, tbb, trx)
        // cycle_kontrol

        // sistem

        // manuelmodenedenleri
        await updateManualReasons(tbb, trx)
        // analoginput
        await updateAnalogInputs(numMachineId, tbb, trx)
        // analogoutput
        await updateAnalogOutputs(numMachineId, tbb, trx)
        // digitalinput
        await updateDigitalInputs(numMachineId, tbb, trx)
        // digitaloutput
        await updateDigitalOutputs(numMachineId, tbb, trx)
        // sayac
        await updateCounters(numMachineId, tbb, trx)

        // commands general
        await updateCommandsGeneral(numMachineId, tbb, trx)
        // commands params
        await updateCommandParameters(numMachineId, tbb, trx)
        // IO
        await updateCommandIO(numMachineId, tbb, trx)
        // commands feedback
        await updateCommandFeedback(numMachineId, tbb, trx)
        // commands function alarms and alarms
        await updateCommandAlarms(numMachineId, tbb, trx)
        // commands graphic
        await updateCommandGraphic(numMachineId, tbb, trx)
        // commands editing
        await updateCommandEditing(numMachineId, tbb, trx)
        // lock general
        await updateLocksGeneral(numMachineId, tbb, trx)
        // locks inputs - buraya kadar
        await updateLocksInput(numMachineId, tbb, trx)
        // locks outputs

        // global command formulas
        await updateGlobalCommandFormulas(numMachineId, tbb, trx)
        // consumption
        await updateConsumption(numMachineId, tbb, trx)
      })
    })
  } else {
    console.log('typeof machineId = ', typeof machineId)
  }
  return res
})
