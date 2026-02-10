import { IoValuesNotFoundError } from '~/server/archiveCache'
import { getActiveBatchIoValues, getAnalogInputs, getAnalogOutputs, getArchivedBatchIoValues, getCalculatedValues, getCounters, getDigitalInputs, getDigitalOutputLocks, getDigitalOutputs, getReels, getVirtualInputs, isBatchActive } from '~/server/functions/io'
import { last } from '~/server/utils/functions'
import type {
  AnalogInputOutputType,
  ArchivedIoValues,
  CalculatedValue,
  Counter,
  DigitalInputOutputType,
  Reel,
  VirtualInput,
} from '~/types/archive'
import type { DuoAny, DuoRaw } from '~/types/utils'

// Archived Batch: 443832 , Running Batch: 443892, Machine: 3

interface IoValues {
  active: boolean
  lastRecordDate: Date | null
  analogInputs: AnalogInputOutputType[]
  analogOutputs: AnalogInputOutputType[]
  digitalInputs: DigitalInputOutputType[]
  digitalOutputs: DigitalInputOutputType[]
  digitalOutputLocks: DigitalInputOutputType[]
  counters: Counter[]
  virtualInputs: VirtualInput[]
  cycleTimes: Reel[]
  calculatedValues: CalculatedValue[]
}

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const isActive = await isBatchActive(batchKey)

  if (isActive === null) {
    throw createError({
      statusCode: 404,
      message: 'BATCH_NOT_FOUND',
    })
  }

  try {
    const ioValues: DuoAny<ArchivedIoValues> = isActive
      ? await getActiveBatchIoValues(batchKey)
      : await getArchivedBatchIoValues(batchKey)

    const lastRecordDate = [
      last(ioValues.digitalValues)?.logtime,
      last(ioValues.analogValues)?.logtime,
      last(ioValues.virtualInputValues)?.logtime,
      last(ioValues.cycleTimes)?.cycleDate,
      last(ioValues.calculatedValues)?.logtime,
    ].reduce<Date | undefined>((max, value) => {
      if (!value)
        return max
      if (!max)
        return new Date(value)
      return value > max ? new Date(value) : max
    }, void 0) || null

    const ios: DuoAny<IoValues> = {
      active: isActive,
      lastRecordDate,
      analogInputs: await getAnalogInputs(batchKey, ioValues.analogValues),
      analogOutputs: await getAnalogOutputs(batchKey, ioValues.analogValues),
      digitalInputs: await getDigitalInputs(batchKey, ioValues.digitalValues),
      digitalOutputs: await getDigitalOutputs(batchKey, ioValues.digitalValues),
      digitalOutputLocks: await getDigitalOutputLocks(batchKey, ioValues.digitalValues),
      counters: await getCounters(batchKey, ioValues.analogValues),
      virtualInputs: await getVirtualInputs(batchKey, ioValues.virtualInputValues),
      cycleTimes: await getReels(batchKey, ioValues.cycleTimes),
      calculatedValues: getCalculatedValues(ioValues.calculatedValues),
    }

    return ios
  } catch (error) {
    if (error instanceof IoValuesNotFoundError) {
      throw createError({
        statusCode: 404,
        message: 'IO_VALUES_NOT_FOUND',
        data: { batchKey },
        cause: error,
      })
    } else {
      throw error
    }
  }
})
