import { join, resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import type { TaskContext } from 'vitest'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'
import { MockBatchRepository } from '../src/repository/BatchRepository'
import type { BatchArchiveValues } from '../src/types'

/**
 * Remove milliseconds from ISO 8601 strings.
 *
 * Since Delphi TDateTime is a floating point number, millisecond discrepancies can occur between API response and extracted data.
 */
function removeMs(iso: string) {
  return iso.replace(/\.\d+(Z|[+-]\d{2}:\d{2})$/, '$1')
}

function removeMsFromLogtime<T extends { logtime: string }>(arr: T[]) {
  return arr.map(item => ({
    ...item,
    logtime: removeMs(item.logtime),
  }))
}

function removeMsFromCycleDate(arr: { cycleDate: string }[]) {
  return arr.map(item => ({
    ...item,
    cycleDate: removeMs(item.cycleDate),
  }))
}

describe('integration Test', () => {
  const batches = [
    // Zipped batch, should point to `archive/10/202508/46931`
    { batchKey: 46931, machineId: 10, startTime: '2025-08-15T08:00:00' },
    // Unzipped batch, should point to `archive/11/202506/85352`
    { batchKey: 85352, machineId: 11, startTime: '2025-06-12T10:00:00' },
  ]
  const repo = new MockBatchRepository(batches)
  const fixtureDir = resolve(import.meta.dirname, 'fixtures/archive')
  const app = buildApp(repo, { logger: false }, {
    archiveDirectory: fixtureDir,
    timezoneOffset: -180,
  })

  const testCases = [
    { label: 'zipped archive', batch: batches[0] },
    { label: 'unzipped archive', batch: batches[1] },
  ]

  const expected = JSON.parse(readFileSync(join(fixtureDir, 'expected.json'), 'utf-8'))

  for (const testCase of testCases) {
    describe(`test ${testCase.label}`, () => {
      let response: Awaited<ReturnType<typeof app.inject>>
      let actual: BatchArchiveValues

      beforeAll(async () => {
        response = await app.inject({
          method: 'GET',
          url: `/?${testCase.batch.batchKey}`,
        })
        actual = response.json() as BatchArchiveValues
      })

      /**
       * Status code is only available after `beforeAll`, so we need to skip tests dynamically.
       */
      function skipIfNot200(context: TaskContext) {
        if (response.statusCode !== 200) {
          context.skip()
        }
      }

      it('should respond with 200', () => {
        expect(response.statusCode).toBe(200)
      })

      describe('response structure', () => {
        it('should match metadata', (context) => {
          skipIfNot200(context)
          expect(actual.batchKey).toBe(testCase.batch.batchKey)
          expect(actual.machineId).toBe(testCase.batch.machineId)
          expect(actual.startTime).toBe(testCase.batch.startTime)
        })

        const testKeys = [
          { key: 'analogValues', remover: removeMsFromLogtime },
          { key: 'digitalValues', remover: removeMsFromLogtime },
          { key: 'calculatedValues', remover: removeMsFromLogtime },
          { key: 'virtualInputValues', remover: removeMsFromLogtime },
          { key: 'cycleTimes', remover: removeMsFromCycleDate },
        ] as {
          key: keyof Omit<BatchArchiveValues, 'batchKey' | 'machineId' | 'startTime'>
          remover: (arr: any[]) => any[]
        }[]

        it.for(testKeys)('$key should match', ({ key, remover }, context) => {
          skipIfNot200(context)
          expect(Array.isArray(actual[key])).toBe(true)
          expect(actual[key].length).toBe(expected[key].length)
          expect(remover(actual[key])).toEqual(remover(expected[key]))
        })
      })
    })
  }

  describe('test error handling', () => {
    it('should return 404 for non-existent batch id', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/?99999`,
      })

      expect(response.statusCode).toBe(404)
    })

    describe('invalid batch id handling', () => {
      it('should return 400 for empty batch id', async () => {
        const response = await app.inject({
          method: 'GET',
          url: `/?`,
        })
        expect(response.statusCode).toBe(400)
      })

      it('should return 400 for non-integer batch id', async () => {
        const response = await app.inject({
          method: 'GET',
          url: `/?abc`,
        })
        expect(response.statusCode).toBe(400)
      })

      it('should return 400 for float batch id', async () => {
        const response = await app.inject({
          method: 'GET',
          url: `/?123.45`,
        })
        expect(response.statusCode).toBe(400)
      })

      it('should return 400 for negative batch id', async () => {
        const response = await app.inject({
          method: 'GET',
          url: `/?-123`,
        })
        expect(response.statusCode).toBe(400)
      })
    })
  })
})
