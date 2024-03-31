import { withTbbFtpClient } from 'tbb-ftp-client'
import { getQuery } from 'h3'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateBatchParameters, updateCommandAlarms, updateCommandIO, updateCommandParameters, updateConsumption, updateCycleControl, updateDigitalInputs, updateGlobalCommandFormulas, updateLocksGeneral, updateLocksOutput, updateSystemParams } from '~/server/utils/updateDatabase'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  const numMachineId = Number.parseInt(machineId as string)
  const sse = useSSE()

  if (!Number.isNaN(numMachineId)) {
    const ip = await knex('BFMACHINES')
      .where('MACHINEID', numMachineId)
      .select('IP')
      .first()
      .then(row => row ? row.IP : null)

    try {
      await withTbbFtpClient(ip, async (tbb) => {
        await knex.transaction(async (trx) => {
        // controllerModel
          await updateMachineController(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'controller updated' })
          // baslatmaparametreleri
          await updateBatchParameters(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'batch parameters updated' })
          // commandGroup
          await updateCommandGroups(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'command groups updated' })
          // cycle_kontrol
          await updateCycleControl(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'cycle control updated' })
          // sistem
          await updateSystemParams(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'system parameters updated' })
          // manuelmodenedenleri
          await updateManualReasons(tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'manual reasons updated' })
          // analoginput
          await updateAnalogInputs(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'analog inputs updated' })
          // analogoutput
          await updateAnalogOutputs(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'analog outputs updated' })
          // digitalinput
          await updateDigitalInputs(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'digital inputs updated' })
          // digitaloutput
          await updateDigitalOutputs(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'digital outputs updated' })
          // sayac
          await updateCounters(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'counters updated' })
          // commands general
          await updateCommandsGeneral(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'general commands updated' })
          // commands params
          await updateCommandParameters(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'command parameters updated' })
          // IO
          await updateCommandIO(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'command IO updated' })
          // commands feedback
          await updateCommandFeedback(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'command feedback updated' })
          // commands function alarms and alarms
          await updateCommandAlarms(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'command alarms updated' })
          // commands graphic
          await updateCommandGraphic(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'command graphic updated' })
          // commands editing
          await updateCommandEditing(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'command editing updated' })
          // lock general
          await updateLocksGeneral(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'lock general updated' })
          // locks inputs - buraya kadar
          await updateLocksInput(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'lock input updated' })
          // locks outputs
          await updateLocksOutput(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'lock output updated' })
          // global command formulas
          await updateGlobalCommandFormulas(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'global command formulas updated' })
          // consumption
          await updateConsumption(numMachineId, tbb, trx)
          sse.broadcast(sse.clients[0], 'log', { message: 'consumptions updated' })
        })
      }, { timeout: 1000 })
    } catch (error) {
      console.error(error)
      sse.broadcast(sse.clients[0], 'log', { message: error })
      if (error.message.includes('Timeout')) {
        throw createError({ statusMessage: 'MACHINE_CONN_TIMEOUT', statusCode: 504 })
      }
    }
  } else {
    sse.broadcast(sse.clients[0], 'log', { message: 'Invalid machineId parameter. Expected number.' })
    throw new TypeError('Invalid machineId parameter. Expected number.')
  }
})
