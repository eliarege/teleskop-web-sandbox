import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'
import type { UnplannedEventsRaw } from '~/shared/types'

const router = createRouter()
router.get('/task', defineEventHandler(async () => {
  const nonplannedEvents: UnplannedEventsRaw[] = await knex('dbo.DYBFBATCHPLAN as P')
    .select({
      planKey: 'P.PLANKEY',
      recordTime: 'P.RECORDTIME',
      jobOrder: 'P.JOBORDER',
      plannedMachineId: 'P.PLANNEDMACHINE',
      programCount: 'P.PRGCOUNT',
      plannedStartTime: 'P.PLANNEDSTARTTIME',
      isDeleted: 'P.ISDELETED',
      isStarted: 'P.ISSTARTED',
      isStopped: 'P.ISSTOPPED',
      theoricalDuration: knex.raw(`
        (SELECT SUM(B.DURATION)
        FROM BFMASTERPRGHEADER B
        WHERE B.MACHINEID = 7
          AND B.PROGNO IN (SELECT RECIPENO FROM DYBFBATCHORDERRECIPEHEADER WHERE PLANKEY = P.PLANKEY))
    `),
      fabricWeight: 'P.FABRICWEIGHT',
      note: 'P.NOTE',
      erpFieldName: 'D.ERPFIELDNAME',
      batchParameterId: 'R.BATCHPARAMETERID',
      value: 'R.VALUE',
    })
    .leftJoin('dbo.PTBATCHPLANQUEUE as Q', 'Q.PLANKEY', 'P.PLANKEY')
    .leftJoin('dbo.DYBFBATCHPLANPARAMETERS as R', (builder) => {
      builder.on('R.PLANKEY', 'P.PLANKEY').andOn('R.PARAMSTRING', '=', knex.raw("'Kilo'"))
    })
    .leftJoin('dbo.BFERPPARAMETERDEFINITIONS as D', (builder) => {
      builder.on('D.MACHINEID', 'P.MACHINEIDLIST').andOn('D.PARAMID', 'R.BATCHPARAMETERID')
    })
    .where('Q.PLANKEY', null)
    .andWhere('P.ISSTARTED', 0)
    .andWhere((builder) => {
      builder.whereNull('P.ISDELETED').orWhere('P.ISDELETED', 0)
    })
    .andWhere((builder) => {
      builder.whereNull('P.ISDELETESENDTOMANUNITES').orWhere('P.ISDELETESENDTOMANUNITES', 0)
    })
    .andWhere('P.LASTFORJOBORDER', 1)
    .andWhereBetween('P.RECORDTIME', ['2023-07-01', '2023-07-08'])

  return nonplannedEvents
}))

export default useBase('/api/non-planned', router.handler)
