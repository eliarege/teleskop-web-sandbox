import { withTbbFtpClient } from 'tbb-ftp-client'
import { getQuery } from 'h3'
import { inferBoolean } from 'utils'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateArchives, updateBatchParameters, updateCommandAlarms, updateCommandIO, updateCommandParameters, updateConsumption, updateCycleControl, updateDigitalInputs, updateERPParams, updateGlobalCommandFormulas, updateLocksGeneral, updateLocksOutput, updateSystemParams } from '~/server/utils/updateDatabase'
import { DatabaseQueryError } from '~/server/error'

const sseLoggingEnabled = inferBoolean(useRuntimeConfig().sseLoggingEnabled)

export default defineEventHandler(async (event) => {
  const { machineId, sseId } = getQuery(event)

  const numMachineId = Number.parseInt(machineId as string)
  const sse = useSSE()
  let client: { id: string, event: any } | undefined
  if (sseId) {
    client = sse.clients.find(c => c.id === sseId)
  }

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
            { func: () => updateMachineController(numMachineId, tbb, trx), message: 'controller updated' },
            // baslatmaparametreleri
            { func: () => updateBatchParameters(numMachineId, tbb, trx), message: 'batch parameters updated' },
            // command groups
            { func: () => updateCommandGroups(numMachineId, tbb, trx), message: 'command groups updated' },
            // cycle control
            { func: () => updateCycleControl(numMachineId, tbb, trx), message: 'cycle control updated' },
            // sistem
            { func: () => updateSystemParams(numMachineId, tbb, trx), message: 'system parameters updated' },
            // manuelmodenedenleri
            { func: () => updateManualReasons(tbb, trx), message: 'manual reasons updated' },
            // analoginput
            { func: () => updateAnalogInputs(numMachineId, tbb, trx), message: 'analog inputs updated' },
            // analogoutput
            { func: () => updateAnalogOutputs(numMachineId, tbb, trx), message: 'analog outputs updated' },
            // digitalinput
            { func: () => updateDigitalInputs(numMachineId, tbb, trx), message: 'digital inputs updated' },
            // digitaloutput
            { func: () => updateDigitalOutputs(numMachineId, tbb, trx), message: 'digital outputs updated' },
            // sayac
            { func: () => updateCounters(numMachineId, tbb, trx), message: 'counters updated' },
            // commands general
            { func: () => updateCommandsGeneral(numMachineId, tbb, trx), message: 'general commands updated' },
            // commands params
            { func: () => updateCommandParameters(numMachineId, tbb, trx), message: 'command parameters updated' },
            // IO
            { func: () => updateCommandIO(numMachineId, tbb, trx), message: 'command IO updated' },
            // commands feedback
            { func: () => updateCommandFeedback(numMachineId, tbb, trx), message: 'command feedback updated' },
            // commands function alarms and alarms
            { func: () => updateCommandAlarms(numMachineId, tbb, trx), message: 'command alarms updated' },
            // commands graphic
            { func: () => updateCommandGraphic(numMachineId, tbb, trx), message: 'command graphic updated' },
            // commands editing
            { func: () => updateCommandEditing(numMachineId, tbb, trx), message: 'command editing updated' },
            // lock general
            { func: () => updateLocksGeneral(numMachineId, tbb, trx), message: 'lock general updated' },
            // locks inputs - buraya kadar
            { func: () => updateLocksInput(numMachineId, tbb, trx), message: 'lock input updated' },
            // locks outputs
            { func: () => updateLocksOutput(numMachineId, tbb, trx), message: 'lock output updated' },
            // global command formulas
            { func: () => updateGlobalCommandFormulas(numMachineId, tbb, trx), message: 'global command formulas updated' },
            // consumption
            { func: () => updateConsumption(numMachineId, tbb, trx), message: 'consumptions updated' },
            // erp params
            { func: () => updateERPParams(numMachineId, tbb, trx), message: 'ERP params updated' },
            // archives
            { func: () => updateArchives(numMachineId, tbb, trx), message: 'archives updated' },
          ]

          for (const { func, message } of updateFunctions) {
            const res = await func()
            if (sseLoggingEnabled && res && client) {
              sse.broadcast(client, 'log', { message })
            }
          }
          if (sseLoggingEnabled && client) {
            sse.broadcast(client, 'log', { message: 'project loaded successfully' })
          }
        })
      }, { timeout: 1000 })
    } catch (error: any) {
      console.error(error)
      if (sseLoggingEnabled && error instanceof DatabaseQueryError && client) {
        sse.broadcast(client, 'log', { type: 'error', message: `Error: ${error.message}` })
      }
      if (error.message.includes('Timeout')) {
        throw createError({ statusMessage: 'MACHINE_CONN_TIMEOUT', statusCode: 504 })
      } else {
        throw createError({ statusMessage: 'MACHINE_CONN_ERROR', statusCode: 500 })
      }
    }
  } else {
    if (client)
      sse.broadcast(client, 'log', { type: 'error', message: 'Error: Invalid machineId parameter. Expected number.' })
    throw new TypeError('Invalid machineId parameter. Expected number.')
  }
})
