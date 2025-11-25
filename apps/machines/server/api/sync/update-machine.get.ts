import { withTbbFtpClient } from '@teleskop/tbb-ftp-client'
import { getQuery } from 'h3'
import { inferBoolean } from '@teleskop/utils'
import { z } from 'zod'
import type { Knex } from 'knex'
import type { TonelloConfiguration, TonelloFunction, TonelloInputOutputList, TonelloResponse } from '@teleskop/core'
import { TonelloApi } from '@teleskop/core'
import { ErrorMessageKey } from '~/shared/enums'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateArchives, updateBatchParameters, updateCommandAlarms, updateCommandIO, updateCommandParameters, updateConsumption, updateCycleControl, updateDigitalInputs, updateERPParams, updateGlobalCommandFormulas, updateIOChangedEvent, updateIcons, updateLocksGeneral, updateLocksOutput, updateProjectTranslations, updateSystemParams } from '~/server/utils/updateDatabase'
import { DatabaseQueryError, UnsupportedDatabaseVersionError } from '~/server/error'
import type { UpdateContext } from '~/server/lib/types'
import { updateTonelloFunctions } from '~/server/lib/tonello/functions'
import { updateTonelloMachineParameters } from '~/server/lib/tonello/machine-constants'
import { updateTonelloInputOutputs } from '~/server/lib/tonello/input-output'
import { updateTonelloProjectTranslations } from '~/server/lib/tonello/locale'
import { updateTonelloBatchParameters } from '~/server/lib/tonello/batch-parameters'

const sseLoggingEnabled = inferBoolean(useRuntimeConfig().sseLoggingEnabled)

const querySchema = z.object({
  machineId: z.coerce.number().int().nonnegative(),
  sseId: sseLoggingEnabled ? z.string() : z.string().optional(),
})

export default defineAuthEventHandler(async (event) => {
  const query = getQuery(event)
  const validation = querySchema.safeParse(query)
  if (!validation.success) {
    throw createError({
      message: 'Invalid query parameters',
      statusCode: 400,
      data: validation.error.issues,
    })
  }
  const { machineId, sseId } = validation.data
  const sse = useSSE()

  const machine = await knex
    .from('BFMACHINES')
    .where('MACHINEID', machineId)
    .first({ host: 'IP', tbbModel: 'TBBMODEL' })

  if (!machine) {
    throw createError({
      message: `Invalid machineId: ${machineId}`,
      statusCode: 404,
    })
  }

  type Step = {
    fn: (trx: Knex.Transaction) => Promise<unknown>
    message: string
  }

  function handleAndCreateError(err: unknown): Error {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    const userMessage = mapErrorToUserMessage(err)

    if (sseId) {
      sse.send(sseId, 'error-log', {
        message: errorMessage,
        progress: 100,
      })
      sse.send(sseId, 'error', {
        progress: 100,
        message: userMessage.code,
        details: userMessage.details,
      })
    }

    console.error(err)
    return createError({
      message: 'UPDATE_FAILED',
      statusCode: 500,
      data: { message: errorMessage },
    })
  }

  async function runSteps(steps: Step[]) {
    const totalSteps = steps.length
    let currentStep = 0

    const getCurrentProgress = () => Math.round((currentStep / totalSteps) * 100)

    await knex.transaction(async (trx) => {
      for (const { fn, message } of steps) {
        if (sseId) {
          sse.send(sseId, 'start', {
            message,
            progress: getCurrentProgress(),
          })
        }

        try {
          await fn(trx)
          currentStep++
          if (sseId) {
            sse.send(sseId, 'log', {
              message,
              progress: getCurrentProgress(),
            })
          }
        } catch (err: unknown) {
          throw handleAndCreateError(err)
        }
      }
    })
  }

  // Handle TBB machines
  if (machine.tbbModel !== 'Tonello') {
    await withTbbFtpClient(machine.host, async (tbb) => {
      await runSteps([
        { fn: trx => updateMachineController(machineId, tbb, trx), message: 'controller-updated' },
        { fn: trx => updateBatchParameters(machineId, tbb, trx), message: 'batch-parameters-updated' },
        { fn: trx => updateCommandGroups(machineId, tbb, trx), message: 'command-groups-updated' },
        { fn: trx => updateCycleControl(machineId, tbb, trx), message: 'cycle-control-updated' },
        { fn: trx => updateSystemParams(machineId, tbb, trx), message: 'system-parameters-updated' },
        { fn: trx => updateManualReasons(machineId, tbb, trx), message: 'manual-reasons-updated' },
        { fn: trx => updateAnalogInputs(machineId, tbb, trx), message: 'analog-inputs-updated' },
        { fn: trx => updateAnalogOutputs(machineId, tbb, trx), message: 'analog-outputs-updated' },
        { fn: trx => updateDigitalInputs(machineId, tbb, trx), message: 'digital-inputs-updated' },
        { fn: trx => updateDigitalOutputs(machineId, tbb, trx), message: 'digital-outputs-updated' },
        { fn: trx => updateCounters(machineId, tbb, trx), message: 'counters-updated' },
        { fn: trx => updateMachineParameters(machineId, tbb, trx), message: 'machine-parameters-updated' },
        { fn: trx => updateCommandsGeneral(machineId, tbb, trx), message: 'general-commands-updated' },
        { fn: trx => updateCommandParameters(machineId, tbb, trx), message: 'command-parameters-updated' },
        { fn: trx => updateCommandIO(machineId, tbb, trx), message: 'command-io-updated' },
        { fn: trx => updateCommandFeedback(machineId, tbb, trx), message: 'command-feedback-updated' },
        { fn: trx => updateCommandAlarms(machineId, tbb, trx), message: 'command-alarms-updated' },
        { fn: trx => updateCommandGraphic(machineId, tbb, trx), message: 'command-graphic-updated' },
        { fn: trx => updateCommandEditing(machineId, tbb, trx), message: 'command-editing-updated' },
        { fn: trx => updateLocksGeneral(machineId, tbb, trx), message: 'lock-general-updated' },
        { fn: trx => updateLocksInput(machineId, tbb, trx), message: 'lock-input-updated' },
        { fn: trx => updateLocksOutput(machineId, tbb, trx), message: 'lock-output-updated' },
        { fn: trx => updateGlobalCommandFormulas(machineId, tbb, trx), message: 'global-command-formulas-updated' },
        { fn: trx => updateConsumption(machineId, tbb, trx), message: 'consumptions-updated' },
        { fn: trx => updateERPParams(machineId, tbb, trx), message: 'erp-parameters-updated' },
        { fn: trx => updateIOChangedEvent(machineId, tbb, trx), message: 'io-change-events-updated' },
        { fn: trx => updateIcons(machineId, tbb, trx), message: 'icons-updated' },
        { fn: trx => updateArchives(machineId, tbb, trx), message: 'archives-updated' },
        { fn: trx => updateProjectTranslations(machineId, tbb, trx), message: 'translations-updated' },
      ])
    })
  }
  // Handle tonello machines
  else {
    const api = new TonelloApi(`http://${machine.host}:1234`)
    const ctx: UpdateContext = {
      errors: [],
      messages: [],
    }
    let functions: TonelloResponse<TonelloFunction[]>
    let ioList: TonelloResponse<TonelloInputOutputList>
    let config: TonelloResponse<TonelloConfiguration>

    try {
      functions = await api.fetchFunctions()
      ioList = await api.fetchInputOutputList()
      config = await api.fetchConfiguration()
    } catch (err: unknown) {
      throw handleAndCreateError(err)
    }

    const parameters = config.data.pages.flatMap(p => p.params)

    const throwOnError = (ctx: UpdateContext) => {
      if (ctx.errors.length > 0) {
        console.error('Errors during updating Tonello project:', ctx.errors)
        throw createError({
          message: 'UPDATE_FAILED',
          statusCode: 500,
          data: ctx.errors,
        })
      }
    }

    await runSteps([
      {
        fn: async (trx) => {
          await updateTonelloFunctions(trx, machineId, functions.data, ctx)
          throwOnError(ctx)
        },
        message: 'functions-updated',
      },
      {
        fn: async (trx) => {
          await updateTonelloInputOutputs(trx, machineId, ioList.data)
          throwOnError(ctx)
        },
        message: 'input-outputs-updated',
      },
      {
        fn: async (trx) => {
          await updateTonelloMachineParameters(trx, machineId, parameters, ctx)
          throwOnError(ctx)
        },
        message: 'machine-parameters-updated',
      },
      {
        fn: async (trx) => {
          await updateTonelloBatchParameters(trx, machineId)
        },
        message: 'batch-parameters-updated',
      },
      {
        fn: async (trx) => {
          await updateTonelloProjectTranslations(trx, machineId, ctx.messages)
          throwOnError(ctx)
        },
        message: 'translations-updated',
      },
    ])
  }
})

function mapErrorToUserMessage(error: any): { code: ErrorMessageKey, details?: any } {
  const msg = error.message ?? ''

  // --- Bağlantı / Ağ hataları ---
  if (msg.includes('Timeout')) {
    return { code: ErrorMessageKey.Timeout }
  }
  if (msg.includes('ECONNREFUSED')) {
    return { code: ErrorMessageKey.ConnectionRefused }
  }
  if (msg.includes('ENETUNREACH') || msg.includes('EHOSTUNREACH')) {
    return { code: ErrorMessageKey.NetworkUnreachable }
  }
  if (msg.includes('<no response>')) {
    return { code: ErrorMessageKey.ApiNoResponse }
  }
  if (msg.includes('EAI_AGAIN')) {
    return { code: ErrorMessageKey.AddressResolutionFailed }
  }

  // --- FTP / TBB istemcisi ---
  if (msg.includes('FTP') || msg.includes('tbb-ftp-client')) {
    return { code: ErrorMessageKey.FtpError }
  }

  // --- Veritabanı hataları ---
  if (error instanceof UnsupportedDatabaseVersionError) {
    return {
      code: ErrorMessageKey.DatabaseUnsupportedVersion,
      details: {
        expectedVersion: error.expectedVersion,
        actualVersion: error.actualVersion,
      },
    }
  }
  if (error instanceof DatabaseQueryError) {
    return { code: ErrorMessageKey.DatabaseQueryError }
  }
  if (msg.includes('deadlock') || msg.includes('lock wait timeout')) {
    return { code: ErrorMessageKey.DatabaseDeadlock }
  }
  if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
    return { code: ErrorMessageKey.DatabaseDuplicateKey }
  }

  // --- Validation / Geçersiz parametre ---
  if (msg.includes('Invalid machineId')) {
    return { code: ErrorMessageKey.InvalidMachineId }
  }
  if (msg.includes('SSE ID REQUIRED')) {
    return { code: ErrorMessageKey.SseIdRequired }
  }

  // --- Genel / bilinmeyen ---
  return { code: ErrorMessageKey.Unknown }
}
