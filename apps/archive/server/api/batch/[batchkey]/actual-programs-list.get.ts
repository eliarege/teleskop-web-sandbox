import { isThisISOWeek } from 'date-fns'
import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)

  const programNoList = (await db('BAACTUALPRGSTEPS as S')
    .select('S.PRGNO', 'H.NAME')
    .where('S.BATCHKEY', Number(batchKey))
    .orderBy('S.STEPNO', 'asc')
    .join('BAMASTERPRGHEADER as H', function () {
      this.on('S.PRGNO', '=', 'H.PROGNO')
    })
    .join('BADATA as D', function () {
      this.on('D.MACHINEID', '=', 'H.MACHINEID')
        .andOn('S.BATCHKEY', '=', 'D.BATCHKEY')
    })
    .whereRaw('CONVERT(datetime, S.STARTTIME) > CONVERT(datetime, H.RELEASEDATE)')
    .andWhere((builder) => {
      builder.whereNull('H.RELEASEENDDATE')
        .orWhereRaw('CONVERT(datetime, H.RELEASEENDDATE) > CONVERT(datetime, S.STARTTIME)')
    })
    // .andWhereRaw('CONVERT(datetime, S.STARTTIME) < CONVERT(datetime, H.RELEASEENDDATE)')

  )
  const actualProgramNoList: Array<{ programNo: number, programName: string }> = []
  programNoList.forEach((prg: { PRGNO: number, NAME: string }, index) => {
    if (index === 0 || prg.PRGNO !== programNoList[index - 1].PRGNO)
      actualProgramNoList.push({ programNo: Number(prg.PRGNO), programName: prg.NAME })
  })
  return actualProgramNoList
})
