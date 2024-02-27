import { withTbbFtpClient } from 'tbb-ftp-client'
import { getQuery } from 'h3'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateBatchParameters, updateCommandAlarms, updateCommandIO, updateCommandParameters, updateConsumption, updateCycleControl, updateDigitalInputs, updateGlobalCommandFormulas, updateLocksGeneral, updateLocksOutput, updateSystemParams } from '~/server/utils/updateDatabase'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const numMachineId = Number.parseInt(machineId as string)
  let res
  if (!Number.isNaN(numMachineId)) {
    const ip = await knex('BFMACHINES')
      .where('MACHINEID', numMachineId)
      .select('IP')
      .first()
      .then(row => row ? row.IP : null)
    await withTbbFtpClient(ip, async (tbb) => {
      await knex.transaction(async (trx) => {
        // controllerModel
        await updateMachineController(numMachineId, tbb, trx)
        // baslatmaparametreleri
        await updateBatchParameters(numMachineId, tbb, trx)
        // commandGroup
        await updateCommandGroups(numMachineId, tbb, trx)
        // cycle_kontrol
        await updateCycleControl(numMachineId, tbb, trx)
        // sistem
        await updateSystemParams(numMachineId, tbb, trx)
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
        await updateLocksOutput(numMachineId, tbb, trx)
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
