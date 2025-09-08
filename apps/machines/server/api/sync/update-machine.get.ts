import { withTbbFtpClient } from '@teleskop/tbb-ftp-client'
import { getQuery } from 'h3'
import { inferBoolean } from '@teleskop/utils'
import { ErrorMessageKey } from '~/shared/enums'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateArchives, updateBatchParameters, updateCommandAlarms, updateCommandIO, updateCommandParameters, updateConsumption, updateCycleControl, updateDigitalInputs, updateERPParams, updateGlobalCommandFormulas, updateIOChangedEvent, updateIcons, updateLocksGeneral, updateLocksOutput, updateMachineTranslations, updateSystemParams } from '~/server/utils/updateDatabase'
import { DatabaseQueryError } from '~/server/error'

const sseLoggingEnabled = inferBoolean(useRuntimeConfig().sseLoggingEnabled)
function mapErrorToUserMessage(error: any): ErrorMessageKey {
  const msg = error.message ?? ''

  // --- Bağlantı / Ağ hataları ---
  if (msg.includes('Timeout')) {
    return ErrorMessageKey.Timeout
  }
  if (msg.includes('ECONNREFUSED')) {
    return ErrorMessageKey.ConnectionRefused
  }
  if (msg.includes('ENETUNREACH') || msg.includes('EHOSTUNREACH')) {
    return ErrorMessageKey.NetworkUnreachable
  }
  if (msg.includes('EAI_AGAIN')) {
    return ErrorMessageKey.AddressResolutionFailed
  }

  // --- FTP / TBB istemcisi ---
  if (msg.includes('FTP') || msg.includes('tbb-ftp-client')) {
    return ErrorMessageKey.FtpError
  }

  // --- Veritabanı hataları ---
  if (error instanceof DatabaseQueryError) {
    return ErrorMessageKey.DatabaseQueryError
  }
  if (msg.includes('deadlock') || msg.includes('lock wait timeout')) {
    return ErrorMessageKey.DatabaseDeadlock
  }
  if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
    return ErrorMessageKey.DatabaseDuplicateKey
  }

  // --- Validation / Geçersiz parametre ---
  if (msg.includes('Invalid machineId')) {
    return ErrorMessageKey.InvalidMachineId
  }
  if (msg.includes('SSE ID REQUIRED')) {
    return ErrorMessageKey.SseIdRequired
  }

  // --- Genel / bilinmeyen ---
  return ErrorMessageKey.Unknown
}

export default defineAuthEventHandler(async (event) => {
  const { machineId, sseId } = getQuery(event)
  if (sseLoggingEnabled && !sseId) {
    throw new Error('SSE ID REQUIRED')
  }
  const strSseId = sseId?.toString() ?? ''
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
        const trx = await knex.transaction()
        try {
          const updateFunctions = [
            { func: () => updateMachineController(numMachineId, tbb, trx), message: 'controller-updated' },
            { func: () => updateBatchParameters(numMachineId, tbb, trx), message: 'batch-parameters-updated' },
            { func: () => updateCommandGroups(numMachineId, tbb, trx), message: 'command-groups-updated' },
            { func: () => updateCycleControl(numMachineId, tbb, trx), message: 'cycle-control-updated' },
            { func: () => updateSystemParams(numMachineId, tbb, trx), message: 'system-parameters-updated' },
            { func: () => updateManualReasons(numMachineId, tbb, trx), message: 'manual-reasons-updated' },
            { func: () => updateAnalogInputs(numMachineId, tbb, trx), message: 'analog-inputs-updated' },
            { func: () => updateAnalogOutputs(numMachineId, tbb, trx), message: 'analog-outputs-updated' },
            { func: () => updateDigitalInputs(numMachineId, tbb, trx), message: 'digital-inputs-updated' },
            { func: () => updateDigitalOutputs(numMachineId, tbb, trx), message: 'digital-outputs-updated' },
            { func: () => updateCounters(numMachineId, tbb, trx), message: 'counters-updated' },
            { func: () => updateMachineParameters(numMachineId, tbb, trx), message: 'machine-params-updated' },
            { func: () => updateCommandsGeneral(numMachineId, tbb, trx), message: 'general-commands-updated' },
            { func: () => updateCommandParameters(numMachineId, tbb, trx), message: 'command-parameters-updated' },
            { func: () => updateCommandIO(numMachineId, tbb, trx), message: 'command-io-updated' },
            { func: () => updateCommandFeedback(numMachineId, tbb, trx), message: 'command-feedback-updated' },
            { func: () => updateCommandAlarms(numMachineId, tbb, trx), message: 'command-alarms-updated' },
            { func: () => updateCommandGraphic(numMachineId, tbb, trx), message: 'command-graphic-updated' },
            { func: () => updateCommandEditing(numMachineId, tbb, trx), message: 'command-editing-updated' },
            { func: () => updateLocksGeneral(numMachineId, tbb, trx), message: 'lock-general-updated' },
            { func: () => updateLocksInput(numMachineId, tbb, trx), message: 'lock-input-updated' },
            { func: () => updateLocksOutput(numMachineId, tbb, trx), message: 'lock-output-updated' },
            { func: () => updateGlobalCommandFormulas(numMachineId, tbb, trx), message: 'global-command-formulas-updated' },
            { func: () => updateConsumption(numMachineId, tbb, trx), message: 'consumptions-updated' },
            { func: () => updateERPParams(numMachineId, tbb, trx), message: 'erp-params-updated' },
            { func: () => updateIOChangedEvent(numMachineId, tbb, trx), message: 'io-change-events-updated' },
            { func: () => updateIcons(numMachineId, tbb, trx), message: 'icons-updated' },
            { func: () => updateArchives(numMachineId, tbb, trx), message: 'archives-updated' },
            { func: () => updateMachineTranslations(numMachineId, tbb, trx), message: 'translations-updated' },
          ]
          const totalSteps = updateFunctions.length
          let currentStep = 0

          for (const { func, message } of updateFunctions) {
            const startingMessage = message.replace('-updated', '-starting')
            const progress = Math.round((currentStep / totalSteps) * 100)
            sse.send(strSseId, 'start', { message: startingMessage, progress })

            try {
              await func()
              currentStep++
              const successProgress = Math.round((currentStep / totalSteps) * 100)
              sse.send(strSseId, 'log', { message, progress: successProgress })
            } catch (err: any) {
              const errorMessage = err.message
              const userMessage = mapErrorToUserMessage(err)

              await trx.rollback()
              sse.send(strSseId, 'error-log', {
                message: errorMessage,
                progress: 100,
              })
              sse.send(strSseId, 'error', {
                message: userMessage,
                progress: 100,
              })
              throw createError({ statusMessage: 'UPDATE_FAILED', message: err.message, statusCode: 500 })
            }
          }

          await trx.commit()
          return true
        } catch (err) {
          await trx.rollback()
          throw err
        }
      }, { timeout: 1000 })
    } catch (error: any) {
      if (error instanceof DatabaseQueryError && strSseId) {
        sse.send(strSseId, 'error', { message: `Error: ${error.message}`, progress: 100 })
        throw new DatabaseQueryError(error.message)
      }

      if (error.message.includes('Timeout')) {
        throw createError({ statusMessage: 'MACHINE_CONN_TIMEOUT', message: error.message, statusCode: 504 })
      } else {
        throw createError({ statusMessage: 'MACHINE_CONN_ERROR', message: error.message, statusCode: 500 })
      }
    }
  } else {
    if (strSseId)
      sse.send(strSseId, 'error', { message: 'Error: Invalid machineId parameter. Expected number.', progress: 100 })
    throw new TypeError('Invalid machineId parameter. Expected number.')
  }
})
