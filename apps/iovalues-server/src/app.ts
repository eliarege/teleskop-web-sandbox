import type { Server } from 'node:http'
import type { FastifyError, FastifyHttpOptions } from 'fastify'
import fastify from 'fastify'
import pMemoize from 'p-memoize'
import { LRUCache } from 'lru-cache'
import type { BatchRepository } from './repository/BatchRepository'
import {
  getArchivePaths,
  getRawQuerystring,
  isNonNegativeInteger,
  readAnalogValueFile,
  readArchiveFile,
  readCalculatedValueFile,
  readCycleTimeFile,
  readDigitalValueFile,
  readVirtualInputValueFile,
} from './lib'
import type { BatchArchiveValues } from './types'

export interface AppConfig {
  archiveDirectory: string
  timezoneOffset: number
}

export function buildApp(repo: BatchRepository, options: FastifyHttpOptions<Server>, config: AppConfig) {
  const app = fastify(options)
  const archiveValuesCache = new LRUCache<number, BatchArchiveValues>({ max: 100 })

  const fetchArchiveValues = pMemoize(async (batchKey: number) => {
    const batch = await repo.getBatch(batchKey)
    if (!batch) {
      const error = new Error('Batch not found') as FastifyError
      error.statusCode = 404
      throw error
    }

    const dirs = getArchivePaths(batch, config.archiveDirectory)
    const analogValuesBuffer = await readArchiveFile(dirs.analogValuesPath)
    const digitalValuesBuffer = await readArchiveFile(dirs.digitalValuesPath)
    const calculatedValuesBuffer = await readArchiveFile(dirs.calculatedValuesPath)
    const virtualInputValuesBuffer = await readArchiveFile(dirs.virtualInputValuesPath)
    const cycleTimesBuffer = await readArchiveFile(dirs.cycleTimesPath)

    return {
      batchKey,
      machineId: batch.machineId,
      startTime: batch.startTime,
      analogValues: analogValuesBuffer
        ? readAnalogValueFile(analogValuesBuffer, config.timezoneOffset)
        : [],
      digitalValues: digitalValuesBuffer
        ? readDigitalValueFile(digitalValuesBuffer, config.timezoneOffset)
        : [],
      calculatedValues: calculatedValuesBuffer
        ? readCalculatedValueFile(calculatedValuesBuffer, config.timezoneOffset)
        : [],
      virtualInputValues: virtualInputValuesBuffer
        ? readVirtualInputValueFile(virtualInputValuesBuffer, config.timezoneOffset)
        : [],
      cycleTimes: cycleTimesBuffer
        ? readCycleTimeFile(cycleTimesBuffer, config.timezoneOffset)
        : [],
    }
  }, { cache: archiveValuesCache })

  app.get('/', async (req) => {
    const batchKeyRaw = getRawQuerystring(req)
    if (!isNonNegativeInteger(batchKeyRaw.slice(1))) {
      const error = new Error('batchKey should be a non-negative integer') as FastifyError
      error.statusCode = 400
      throw error
    }
    const batchKey = Number.parseInt(batchKeyRaw.slice(1), 10)
    const batch = await fetchArchiveValues(batchKey)
    return batch
  })
  return app
}
