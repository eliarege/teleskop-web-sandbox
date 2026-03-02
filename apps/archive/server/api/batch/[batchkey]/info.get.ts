import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const config = useRuntimeConfig()

  return await db('BADATA as B')
    .first({
      batchKey: 'B.BATCHKEY',
      machineId: 'B.MACHINEID',
      machineName: 'B.MACHINECODE',
      machineModel: 'M.TBBMODEL',
      jobOrder: 'B.JOBORDER',
      startTime: db.raw(`DATEADD(MINUTE, ?, B.STARTTIME)`, config.teleskopTimezoneOffset),
      endTime: db.raw(`DATEADD(MINUTE, ?, COALESCE(B.ENDTIME, B.CANCELTIME))`, config.teleskopTimezoneOffset),
      cancelTime: db.raw(`DATEADD(MINUTE, ?, B.CANCELTIME)`, config.teleskopTimezoneOffset),
      programCount: 'B.PRGCOUNT',
      operatorCode: 'B.OPRCODE',
      operatorName: 'B.OPRNAME',
      theoreticalDuration: 'B.THEORETICDURAT',
      actualTheoreticalDuration: 'B.ACTUAL_THEORETICDURAT',
      actualDuration: 'B.REALDURATION',
      deviation: 'B.DEVIATION',
      isCancelled: db.raw('CAST(IIF(B.CANCELTIME IS NOT NULL, 1, 0) as bit)'),
    })
    .where('B.BATCHKEY', batchKey)
    .join('BFMACHINES as M', function () {
      this.on('M.MACHINEID', '=', 'B.MACHINEID')
    })
})
