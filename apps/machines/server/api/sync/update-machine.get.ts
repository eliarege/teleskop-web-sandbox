import { withTbbFtpClient } from 'tbb-ftp-client'
import { getQuery } from 'h3'
import { inferBoolean } from 'utils'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateBatchParameters, updateCommandAlarms, updateCommandIO, updateCommandParameters, updateConsumption, updateCycleControl, updateDigitalInputs, updateGlobalCommandFormulas, updateLocksGeneral, updateLocksOutput, updateSystemParams } from '~/server/utils/updateDatabase'
import { DatabaseQueryError } from '~/server/error'

const sseLoggingEnabled = inferBoolean(useRuntimeConfig().sseLoggingEnabled)

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
          const updateFunctions = [
            // controllerModel
            { func: updateMachineController, message: 'controller updated' },
            // baslatmaparametreleri
            { func: updateBatchParameters, message: 'batch parameters updated' },
            // command groups
            { func: updateCommandGroups, message: 'command groups updated' },
            // cycle control
            { func: updateCycleControl, message: 'cycle control updated' },
            // sistem
            { func: updateSystemParams, message: 'system parameters updated' },
            // manuelmodenedenleri
            { func: updateManualReasons, message: 'manual reasons updated' },
            // analoginput
            { func: updateAnalogInputs, message: 'analog inputs updated' },
            // analogoutput
            { func: updateAnalogOutputs, message: 'analog outputs updated' },
            // digitalinput
            { func: updateDigitalInputs, message: 'digital inputs updated' },
            // digitaloutput
            { func: updateDigitalOutputs, message: 'digital outputs updated' },
            // sayac
            { func: updateCounters, message: 'counters updated' },
            // commands general
            { func: updateCommandsGeneral, message: 'general commands updated' },
            // commands params
            { func: updateCommandParameters, message: 'command parameters updated' },
            // IO
            { func: updateCommandIO, message: 'command IO updated' },
            // commands feedback
            { func: updateCommandFeedback, message: 'command feedback updated' },
            // commands function alarms and alarms
            { func: updateCommandAlarms, message: 'command alarms updated' },
            // commands graphic
            { func: updateCommandGraphic, message: 'command graphic updated' },
            // commands editing
            { func: updateCommandEditing, message: 'command editing updated' },
            // lock general
            { func: updateLocksGeneral, message: 'lock general updated' },
            // locks inputs - buraya kadar
            { func: updateLocksInput, message: 'lock input updated' },
            // locks outputs
            { func: updateLocksOutput, message: 'lock output updated' },
            // global command formulas
            { func: updateGlobalCommandFormulas, message: 'global command formulas updated' },
            // consumption
            { func: updateConsumption, message: 'consumptions updated' },
          ]

          for (const { func, message } of updateFunctions) {
            let res = false
            if (func === updateManualReasons) {
              res = await func(tbb, trx)
            } else {
              res = await func(numMachineId, tbb, trx)
            }
            if (res) {
              sse.broadcast(sse.clients[0], 'log', { message })
            }
          }

          sse.broadcast(sse.clients[0], 'log', { message: 'project loaded successfully' })
        })
      }, { timeout: 1000 })
    } catch (error: any) {
      console.error(error)
      if (sseLoggingEnabled && error instanceof DatabaseQueryError) {
        sse.broadcast(sse.clients[0], 'log', { type: 'error', message: `Error: ${error.message}` })
      }
      if (error.message.includes('Timeout')) {
        throw createError({ statusMessage: 'MACHINE_CONN_TIMEOUT', statusCode: 504 })
      } else {
        throw createError({ statusMessage: 'MACHINE_CONN_ERROR', statusCode: 500 })
      }
    }
  } else {
    sse.broadcast(sse.clients[0], 'log', { type: 'error', message: 'Error: Invalid machineId parameter. Expected number.' })
    throw new TypeError('Invalid machineId parameter. Expected number.')
  }
})
