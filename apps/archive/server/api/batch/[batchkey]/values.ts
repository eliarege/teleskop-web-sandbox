import { getActualCommands, getAlarms, getInterventions, getMergedCommands } from '~/server/functions/etc'
import { getBatchIoValues, isBatchActive } from '~/server/functions/io'
import { last } from '~/server/utils/functions'
import type { BatchValues } from '~/types/archive'
import type { DuoAny } from '~/types/utils'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const since = getSinceQuery(event)
  const isActive = await isBatchActive(batchKey)
  if (isActive === null) {
    throw createError({
      statusCode: 404,
      message: 'Batch not found',
    })
  }

  const interventions = await getInterventions(batchKey, since)
  // Çalışması bitmemiş adımların ve alarmların bitip bitmediğini client tarafına iletmenin kolay bir yolu olmadığından şimdilik tüm komutlar döndürülmektedir.
  const alarms = await getAlarms(batchKey)
  const actualCommands = await getActualCommands(batchKey)
  const mergedCommands = await getMergedCommands(batchKey, isActive)
  const ioValues = await getBatchIoValues(batchKey, { since, isActive })

  const latest = [
    last(ioValues.digitalValues)?.logtime,
    last(ioValues.analogValues)?.logtime,
    last(ioValues.virtualInputValues)?.logtime,
    last(ioValues.cycleTimes)?.cycleDate,
    last(interventions)?.time,
  ].reduce<Date | undefined>((max, value) => {
    if (!value)
      return max
    if (!max)
      return new Date(value)
    return value > max ? new Date(value) : max
  }, void 0)

  return {
    active: isActive,
    lastRecordDate: latest || new Date(),
    alarms,
    interventions,
    actualCommands,
    mergedCommands,
    ...ioValues,
  } satisfies DuoAny<BatchValues>
})
