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
      startTime: db.raw(`DATEADD(MINUTE, ?, B.STARTTIME)`, [config.teleskopTimezoneOffset]),
      endTime: db.raw(`DATEADD(MINUTE, ?, COALESCE(B.ENDTIME, B.CANCELTIME))`, [config.teleskopTimezoneOffset]),
      cancelTime: db.raw(`DATEADD(MINUTE, ?, B.CANCELTIME)`, [config.teleskopTimezoneOffset]),
      programCount: 'B.PRGCOUNT',
      operatorCode: 'B.OPRCODE',
      operatorName: 'B.OPRNAME',
      theoreticalDuration: 'B.THEORETICDURAT',
      actualTheoreticalDuration: 'B.ACTUAL_THEORETICDURAT',
      actualDuration: 'B.REALDURATION',
      deviation: 'B.DEVIATION',
      isCancelled: db.raw('CAST(IIF(B.CANCELTIME IS NOT NULL, 1, 0) as bit)'),
      partyNumber: 'BP.VALUE',
    })
    .where('B.BATCHKEY', batchKey)
    .join('BFMACHINES as M', 'M.MACHINEID', '=', 'B.MACHINEID')
    // Parti numarası için eklenen joinler
    .leftJoin('DYBFBATCHPLAN as D', 'D.JOBORDER', '=', 'B.JOBORDER')
    .leftJoin('BFMACHBATCHPARAMETERTYPES as PT', function () {
      this.on('PT.MACHINEID', '=', 'B.MACHINEID').andOn('PT.PARAMTYPEID', '=', db.raw('3'))
    })
    .leftJoin('DYBFBATCHPLANPARAMETERS as BP', function () {
      this.on('BP.PLANKEY', '=', 'D.PLANKEY').andOn('BP.BATCHPARAMETERID', '=', 'PT.PARAMID')
    })
    .where(function () {
      this.where('D.lastForJoborder', 1).orWhereNull('D.lastForJoborder')
    })
})
