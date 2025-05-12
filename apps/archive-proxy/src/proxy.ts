import type { FastifyPluginAsync } from 'fastify'
import { addDays, differenceInCalendarDays } from 'date-fns'
import { $fetch } from 'ofetch'
import { db } from './database'
import { config } from './config'
import type { ArchivedIoValues } from './types'
import { getRawQueryString, pMemoize, withTrailingSlash } from './utils'

const getLastBatchStart = pMemoize(async () => {
  const res = await db
    .from('BADATA')
    .first({ startTime: 'STARTTIME' })
    .orderBy('BATCHKEY', 'desc')
  if (res) {
    return new Date(res.startTime)
  } else {
    throw new Error('No batch found')
  }
}, 20)

export const proxy: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (req) => {
    const querystring = getRawQueryString(req.raw)
    const archivedData = await $fetch<ArchivedIoValues>(withTrailingSlash(config.teleskopArchiveUrl) + querystring)
    const lastBatchStart = await getLastBatchStart()
    const dayDiff = differenceInCalendarDays(new Date(), lastBatchStart)

    // We remove 1 day so we dont return any date values that might be in the future
    addDaysToArchivedData(archivedData, dayDiff - 1)

    return archivedData
  })
}

function addDaysToArchivedData(data: ArchivedIoValues, days: number) {
  data.analogValues.forEach((av) => {
    av.logtime = addDays(new Date(av.logtime), days).toISOString()
  })
  data.digitalValues.forEach((dv) => {
    dv.logtime = addDays(new Date(dv.logtime), days).toISOString()
  })
  data.calculatedValues.forEach((cv) => {
    cv.logtime = addDays(new Date(cv.logtime), days).toISOString()
  })
  data.virtualInputValues.forEach((vi) => {
    vi.logtime = addDays(new Date(vi.logtime), days).toISOString()
  })
  data.cycleTimes.forEach((ct) => {
    ct.cycleDate = addDays(new Date(ct.cycleDate), days).toISOString()
  })
}
