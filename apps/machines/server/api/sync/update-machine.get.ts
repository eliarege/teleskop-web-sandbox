import { withTbbFtpClient } from '@teleskop/tbb-ftp-client'
import { getQuery } from 'h3'
import { inferBoolean } from '@teleskop/utils'
import { z } from 'zod'
import type { Knex } from 'knex'
import { TonelloApi } from '@teleskop/core'
import { ErrorMessageKey } from '~/shared/enums'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateArchives, updateBatchParameters, updateCommandAlarms, updateCommandIO, updateCommandParameters, updateConsumption, updateCycleControl, updateDigitalInputs, updateERPParams, updateGlobalCommandFormulas, updateIOChangedEvent, updateIcons, updateLocksGeneral, updateLocksOutput, updateProjectTranslations, updateSystemParams } from '~/server/utils/updateDatabase'
import { DatabaseQueryError } from '~/server/error'
import type { UpdateContext } from '~/server/lib/types'
import { updateTonelloFunctions } from '~/server/lib/tonello/functions'
import { updateTonelloMachineParameters } from '~/server/lib/tonello/machine-constants'
import { updateTonelloInputOutputs } from '~/server/lib/tonello/input-output'
import { updateTonelloProjectTranslations } from '~/server/lib/tonello/locale'

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
    name: string
  }

  async function runSteps(steps: Step[]) {
    const totalSteps = steps.length
    let currentStep = 0

    const getCurrentProgress = () => Math.round((currentStep / totalSteps) * 100)

    await knex.transaction(async (trx) => {
      for (const { fn, name } of steps) {
        sseId && sse.send(sseId, 'start', {
          name,
          progress: getCurrentProgress(),
        })

        try {
          await fn(trx)
          currentStep++
          sseId && sse.send(sseId, 'log', {
            name,
            progress: getCurrentProgress(),
          })
        } catch (err: any) {
          const errorMessage = err.message
          const userMessage = mapErrorToUserMessage(err)

          sseId && sse.send(sseId, 'error-log', { message: errorMessage, progress: 100 })
          sseId && sse.send(sseId, 'error', {
            name,
            message: userMessage,
            progress: 100,
          })
          throw createError({
            message: 'UPDATE_FAILED',
            statusCode: 500,
            data: { message: errorMessage },
          })
        }
      }
    })
  }

  // Handle TBB machines
  if (machine.tbbModel !== 'Tonello') {
    await withTbbFtpClient(machine.host, async (tbb) => {
      await runSteps([
        { fn: trx => updateMachineController(machineId, tbb, trx), name: 'controller-updated' },
        { fn: trx => updateBatchParameters(machineId, tbb, trx), name: 'batch-parameters-updated' },
        { fn: trx => updateCommandGroups(machineId, tbb, trx), name: 'command-groups-updated' },
        { fn: trx => updateCycleControl(machineId, tbb, trx), name: 'cycle-control-updated' },
        { fn: trx => updateSystemParams(machineId, tbb, trx), name: 'system-parameters-updated' },
        { fn: trx => updateManualReasons(machineId, tbb, trx), name: 'manual-reasons-updated' },
        { fn: trx => updateAnalogInputs(machineId, tbb, trx), name: 'analog-inputs-updated' },
        { fn: trx => updateAnalogOutputs(machineId, tbb, trx), name: 'analog-outputs-updated' },
        { fn: trx => updateDigitalInputs(machineId, tbb, trx), name: 'digital-inputs-updated' },
        { fn: trx => updateDigitalOutputs(machineId, tbb, trx), name: 'digital-outputs-updated' },
        { fn: trx => updateCounters(machineId, tbb, trx), name: 'counters-updated' },
        { fn: trx => updateMachineParameters(machineId, tbb, trx), name: 'machine-parameters-updated' },
        { fn: trx => updateCommandsGeneral(machineId, tbb, trx), name: 'general-commands-updated' },
        { fn: trx => updateCommandParameters(machineId, tbb, trx), name: 'command-parameters-updated' },
        { fn: trx => updateCommandIO(machineId, tbb, trx), name: 'command-io-updated' },
        { fn: trx => updateCommandFeedback(machineId, tbb, trx), name: 'command-feedback-updated' },
        { fn: trx => updateCommandAlarms(machineId, tbb, trx), name: 'command-alarms-updated' },
        { fn: trx => updateCommandGraphic(machineId, tbb, trx), name: 'command-graphic-updated' },
        { fn: trx => updateCommandEditing(machineId, tbb, trx), name: 'command-editing-updated' },
        { fn: trx => updateLocksGeneral(machineId, tbb, trx), name: 'lock-general-updated' },
        { fn: trx => updateLocksInput(machineId, tbb, trx), name: 'lock-input-updated' },
        { fn: trx => updateLocksOutput(machineId, tbb, trx), name: 'lock-output-updated' },
        { fn: trx => updateGlobalCommandFormulas(machineId, tbb, trx), name: 'global-command-formulas-updated' },
        { fn: trx => updateConsumption(machineId, tbb, trx), name: 'consumptions-updated' },
        { fn: trx => updateERPParams(machineId, tbb, trx), name: 'erp-parameters-updated' },
        { fn: trx => updateIOChangedEvent(machineId, tbb, trx), name: 'io-change-events-updated' },
        { fn: trx => updateIcons(machineId, tbb, trx), name: 'icons-updated' },
        { fn: trx => updateArchives(machineId, tbb, trx), name: 'archives-updated' },
        { fn: trx => updateProjectTranslations(machineId, tbb, trx), name: 'translations-updated' },
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
    const functions = await api.fetchFunctions()
    const ioList = await api.fetchInputOutputList()
    const config = await api.fetchConfiguration()
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
          await updateTonelloFunctions(trx, machineId, functions.data.layout.pages, ctx)
          throwOnError(ctx)
        },
        name: 'functions-updated',
      },
      {
        fn: async (trx) => {
          await updateTonelloInputOutputs(trx, machineId, ioList.data)
          throwOnError(ctx)
        },
        name: 'input-outputs-updated',
      },
      {
        fn: async (trx) => {
          await updateTonelloMachineParameters(trx, machineId, parameters, ctx)
          throwOnError(ctx)
        },
        name: 'machine-parameters-updated',
      },
      {
        fn: async (trx) => {
          await updateTonelloProjectTranslations(trx, machineId, ctx.messages)
          throwOnError(ctx)
        },
        name: 'translations-updated',
      },
    ])
  }
})

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
