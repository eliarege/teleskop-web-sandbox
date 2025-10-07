import { describe, expect, it } from 'vitest'
import { getArchivePaths } from '../src/lib'

describe('unit tests', () => {
  const batch = { batchKey: 42144, machineId: 10, startTime: '2024-07-15T08:00:00' }

  it('batch archive paths', () => {
    const paths = getArchivePaths(batch, '/path/to/archive')
    const prefix = '/path/to/archive/10/202407/42144'
    expect(paths).toEqual({
      analogValuesPath: `${prefix}.zip`,
      calculatedValuesPath: `${prefix}_calcVals.zip`,
      cycleTimesPath: `${prefix}_cycleTimesV2.zip`,
      digitalValuesPath: `${prefix}_DioValues_V2.zip`,
      virtualInputValuesPath: `${prefix}_ViValues.zip`,
    })
  })
})
