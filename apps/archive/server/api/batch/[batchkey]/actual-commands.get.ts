import { db } from '~/server/database'
import type { BatchCommand } from '~/types/archive'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const config = useRuntimeConfig()

  const actualCommands: BatchCommand[] = await db
    .from('BAACTUALPRGSTEPS as S')
    .select({
      programNo: 'S.PRGNO',
      programName: 'PH.NAME',
      programIndex: 'S.PRGINDEX',
      stepNo: 'S.STEPNO',
      parallelStepNo: 'S.PARALLELSTEPNO',
      commandNo: 'S.COMMANDNO',
      startTime: db.raw(`DATEADD(MINUTE, ?, S.STARTTIME)`, config.teleskopTimezoneOffset),
      endTime: db.raw(`DATEADD(MINUTE, ?, S.ENDTIME)`, config.teleskopTimezoneOffset),
    })
    .join('BADATA as B', function () {
      this.on('S.BATCHKEY', '=', 'B.BATCHKEY')
    })
    .join('BAMASTERPRGHEADER as PH', function () {
      this.on('S.PRGNO', '=', 'PH.PROGNO')
        .andOn('B.MACHINEID', '=', 'PH.MACHINEID')
    })
    .where('S.BATCHKEY', batchKey)
    .andWhere('S.STARTTIME', '>=', db.raw('PH.RELEASEDATE'))
    .andWhere((b) => {
      b.whereNull('PH.RELEASEENDDATE')
        .orWhere('S.STARTTIME', '<', db.raw('PH.RELEASEENDDATE'))
    })
    .orderBy('S.STEPNO', 'asc')

  return actualCommands
})
