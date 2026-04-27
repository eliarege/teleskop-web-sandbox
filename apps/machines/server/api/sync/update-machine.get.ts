import { withTbbFtpClient } from '@teleskop/tbb-ftp-client'
import { getQuery } from 'h3'
import { z } from 'zod'
import type { Knex } from 'knex'
import { TonelloApi } from '@teleskop/core'
import { knex } from '~/server/connectionPool'
import { updateAnalogInputs, updateArchives, updateBatchParameters, updateCommandAlarms, updateCommandIO, updateCommandParameters, updateConsumption, updateCycleControl, updateDigitalInputs, updateERPParams, updateGlobalCommandFormulas, updateIOChangedEvent, updateIcons, updateLocksGeneral, updateLocksOutput, updateProjectTranslations, updateSystemParams } from '~/server/utils/updateDatabase'
import { DatabaseQueryError, UnsupportedDatabaseVersionError } from '~/server/error'
import type { UpdateContext } from '~/server/lib/types'
import { updateTonelloFunctions } from '~/server/lib/tonello/functions'
import { updateTonelloMachineParameters } from '~/server/lib/tonello/machine-constants'
import { updateTonelloInputOutputs } from '~/server/lib/tonello/input-output'
import { updateTonelloProjectTranslations } from '~/server/lib/tonello/locale'
import { updateTonelloBatchParameters } from '~/server/lib/tonello/batch-parameters'
import { transactionWithAbort } from '~/server/utils/transaction'
import { acquireMachineLock, releaseMachineLock } from '~/server/lib/machine-lock'

const querySchema = z.object({
  machineId: z.coerce.number().int().nonnegative(),
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
  const { machineId } = validation.data

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

  const res = acquireMachineLock(machineId, 'loading-project')
  if (!res.success) {
    throw createError({
      message: `Machine ${machineId} is currently locked for update`,
      statusCode: 423,
      data: { reason: res.reason },
    })
  }

  const result = await createTaskStream(event, async (ctx) => {
    const logError = (err: unknown) => {
      if (ctx.state.isClosed()) {
        return
      }
      const errors = []
      if (err instanceof DatabaseQueryError) {
        errors.push(...err.getMssqlErrors().map(e => `${e.message} (code: ${e.number})`))
      } else {
        errors.push(err instanceof Error ? err.message : 'Unknown error')
      }
      const userMessage = mapErrorToUserMessage(err, ctx.t)

      for (const error of errors) {
        ctx.logger.error(error)
      }
      ctx.logger.error(userMessage)
    }

    type Step = {
      fn: (trx: Knex.Transaction) => Promise<unknown>
      message: string
      /** Yüklenen dosyanın makinedeki yolu */
      path?: string
    }

    const runSteps = async (steps: Step[], startFrom = 0) => {
      const totalSteps = steps.length
      let currentStep = 0

      const getCurrentProgress = () => {
        const progress = Math.round(startFrom + (currentStep / totalSteps) * 100)
        return Math.min(Math.max(progress, 0.1), 99)
      }

      await transactionWithAbort(knex, ctx.signal, async (trx) => {
        for (const { fn, message, path } of steps) {
          ctx.signal.throwIfAborted()
          ctx.logger.info(ctx.t(`${message}-starting`), path ? ` (${path})` : '')
          ctx.state.progress(getCurrentProgress())
          await fn(trx)
          currentStep++
        }
      })
    }

    try {
      if (machine.tbbModel !== 'Tonello') {
        ctx.logger.info(ctx.t('projectUpload.starting'))
        ctx.state.progress(0.1)

        await withTbbFtpClient(machine.host, async (tbb) => {
          await runSteps([
            { fn: trx => updateBatchParameters(machineId, tbb, trx), message: 'batch-parameters', path: '/tbb6500/data/config/baslatmaParametreleri' },
            { fn: trx => updateCommandGroups(machineId, tbb, trx), message: 'command-groups', path: '/tbb6500/data/commands/commandGroup' },
            { fn: trx => updateManualReasons(machineId, tbb, trx), message: 'manual-reasons', path: '/tbb6500/data/config/manuelmodnedenleri' },
            { fn: trx => updateCounters(machineId, tbb, trx), message: 'counters', path: '/tbb6500/data/io/sayac' },
            { fn: trx => updateMachineParameters(machineId, tbb, trx), message: 'machine-parameters', path: '/tbb6500/data/config/makinesabitleri' },
            { fn: trx => updateCommandsGeneral(machineId, tbb, trx), message: 'general-commands', path: '/tbb6500/data/commands/general' },
            { fn: trx => updateCommandParameters(machineId, tbb, trx), message: 'command-parameters', path: '/tbb6500/data/commands/params' },
            { fn: trx => updateCommandIO(machineId, tbb, trx), message: 'command-io', path: '/tbb6500/data/commands/io' },
            { fn: trx => updateCommandFeedback(machineId, tbb, trx), message: 'command-feedback', path: '/tbb6500/data/commands/feedback' },
            { fn: trx => updateCommandAlarms(machineId, tbb, trx), message: 'command-alarms', path: '/tbb6500/data/commands/alarms' },
            { fn: trx => updateCommandGraphic(machineId, tbb, trx), message: 'command-graphic', path: '/tbb6500/data/commands/graphic' },
            { fn: trx => updateCommandEditing(machineId, tbb, trx), message: 'command-editing', path: '/tbb6500/data/commands/editing' },
            { fn: trx => updateLocksGeneral(machineId, tbb, trx), message: 'lock-general', path: '/tbb6500/data/locks/locks_general' },
            { fn: trx => updateLocksInput(machineId, tbb, trx), message: 'lock-input', path: '/tbb6500/data/locks/locks_inputs' },
            { fn: trx => updateLocksOutput(machineId, tbb, trx), message: 'lock-output', path: '/tbb6500/data/locks/locks_outputs' },
            { fn: trx => updateGlobalCommandFormulas(machineId, tbb, trx), message: 'global-command-formulas', path: '/tbb6500/data/config/globalCommandFormulas' },
            { fn: trx => updateERPParams(machineId, tbb, trx), message: 'erp-parameters' },
            { fn: trx => updateIOChangedEvent(machineId, tbb, trx), message: 'io-change-events', path: '/tbb6500/data/config/io_changed_event' },
            { fn: trx => updateIcons(machineId, tbb, trx), message: 'icons', path: '/tbb6500/data/pics/function_*' },
            { fn: trx => updateArchives(machineId, tbb, trx), message: 'archives' },
            { fn: trx => updateProjectTranslations(machineId, tbb, trx), message: 'translations', path: '/tbb6500/data/config/translationsProject*' },
            { fn: trx => updateMachineController(machineId, tbb, trx), message: 'controller', path: '/var/controllerModel' },
            { fn: trx => updateSystemParams(machineId, tbb, trx), message: 'system-parameters', path: '/tbb6500/data/config/sistem' },
            { fn: trx => updateCycleControl(machineId, tbb, trx), message: 'cycle-control', path: '/tbb6500/data/config/manuel/cycle_kontrol' },
            { fn: trx => updateConsumption(machineId, tbb, trx), message: 'consumptions', path: '/tbb6500/data/config/consumption' },
            { fn: trx => updateAnalogInputs(machineId, tbb, trx), message: 'analog-inputs', path: '/tbb6500/data/io/analoginput' },
            { fn: trx => updateAnalogOutputs(machineId, tbb, trx), message: 'analog-outputs', path: '/tbb6500/data/io/analogoutput' },
            { fn: trx => updateDigitalInputs(machineId, tbb, trx), message: 'digital-inputs', path: '/tbb6500/data/io/sayisalinput' },
            { fn: trx => updateDigitalOutputs(machineId, tbb, trx), message: 'digital-outputs', path: '/tbb6500/data/io/sayisaloutput' },
          ])
        })
      } else {
        const api = new TonelloApi(`http://${machine.host}:1234`)
        const updateCtx: UpdateContext = {
          errors: [],
          messages: [],
        }
        ctx.state.progress(0.1)
        ctx.logger.info(ctx.t('projectUpload.fetchingTonelloMachineData'))

        const functions = await api.fetchFunctions()
        const ioList = await api.fetchInputOutputList()
        const config = await api.fetchConfiguration()
        const trxOffsetProgress = 10

        ctx.state.progress(trxOffsetProgress)
        ctx.logger.info(ctx.t('projectUpload.tonelloMachineDataFetched'))

        const parameters = config.data.pages.flatMap(p => p.params)

        const throwOnError = (updateCtx: UpdateContext) => {
          if (updateCtx.errors.length > 0) {
            for (const err of updateCtx.errors) {
              ctx.logger.error(err.code)
            }
            throw new Error('Errors occurred during Tonello machine update')
          }
        }

        await runSteps([
          {
            message: 'functions',
            fn: async (trx) => {
              await updateTonelloFunctions(trx, machineId, functions.data, updateCtx)
              throwOnError(updateCtx)
            },
          },
          {
            message: 'input-outputs',
            fn: async (trx) => {
              await updateTonelloInputOutputs(trx, machineId, ioList.data)
              throwOnError(updateCtx)
            },
          },
          {
            message: 'machine-parameters',
            fn: async (trx) => {
              await updateTonelloMachineParameters(trx, machineId, parameters, updateCtx)
              throwOnError(updateCtx)
            },
          },
          {
            message: 'batch-parameters',
            fn: async (trx) => {
              await updateTonelloBatchParameters(trx, machineId)
            },
          },
          {
            message: 'translations',
            fn: async (trx) => {
              await updateTonelloProjectTranslations(trx, machineId, updateCtx.messages)
              throwOnError(updateCtx)
            },
          },
        ], trxOffsetProgress)
      }
      ctx.state.complete(ctx.t('projectUpload.completed'))
    } catch (err: unknown) {
      console.error(err)
      logError(err)
      ctx.state.fail(ctx.t('projectUpload.failed'))
    } finally {
      releaseMachineLock(machineId)
    }
  }).catch((err) => {
    // Handle stream creation errors
    releaseMachineLock(machineId)
    throw err
  })

  if (result.kind === 'stream') {
    return result.stream
  } else {
    return result.kind
  }
})

interface TaskI18nMeta {
  i18n?: {
    key: string
    params?: Record<string, unknown>
  }
}

function mapErrorToUserMessage(error: any, t: (key: string, params?: Record<string, unknown>) => TaskI18nMeta): TaskI18nMeta {
  const msg = error.message ?? ''

  // --- Bağlantı / Ağ hataları ---
  if (msg.includes('aborted')) {
    return t('taskStream.abortedByUser')
  }
  if (msg.includes('Timeout')) {
    return t('error.timeout')
  }
  if (msg.includes('ECONNREFUSED')) {
    return t('error.connection_refused')
  }
  if (msg.includes('ENETUNREACH') || msg.includes('EHOSTUNREACH')) {
    return t('error.network_unreachable')
  }
  if (msg.includes('<no response>')) {
    return t('error.api_no_response')
  }
  if (msg.includes('EAI_AGAIN')) {
    return t('error.address_resolution_failed')
  }

  // --- FTP / TBB istemcisi ---
  if (msg.includes('FTP') || msg.includes('tbb-ftp-client')) {
    return t('error.ftp')
  }

  // --- Veritabanı hataları ---
  if (error instanceof UnsupportedDatabaseVersionError) {
    return t('error.db.unsupported_version', {
      expectedVersion: error.expectedVersion,
      actualVersion: error.actualVersion,
    })
  }
  if (error instanceof DatabaseQueryError) {
    return t('error.db.query')
  }
  if (msg.includes('deadlock') || msg.includes('lock wait timeout')) {
    return t('error.db.deadlock')
  }
  if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
    return t('error.db.duplicate_key')
  }

  // --- Genel / bilinmeyen ---
  return t('error.unknown')
}
