import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'
import type { PlannedEvents } from '~/shared/types'

const router = createRouter()
router.get('/task', defineEventHandler(async () => {
  const plannedEvents: PlannedEvents[] = await knex('dbo.DYBFBATCHPLAN as p')
    .select({
      planKey: 'p.PLANKEY',
      recordTime: 'p.RECORDTIME',
      jobOrder: 'p.JOBORDER',
      plannedMachine: 'p.PLANNEDMACHINE',
      startedMachine: 'p.STARTEDMACHINEID',
      isDeleted: 'P.ISDELETED',
      isStarted: 'P.ISSTARTED',
      isStopped: 'P.ISSTOPPED',
      programCount: 'p.PRGCOUNT',
      plannedStartTime: 'p.PLANNEDSTARTTIME',
      actualStartTime: 'p.STARTDATETIME',
      theoricalDuration: 'p.TheoricalDuration',
      fabricWeight: 'p.FABRICWEIGHT',
      customerName: 'p.CUSTOMERNAME',
    })
    .leftJoin('dbo.PTBATCHPLANQUEUE as Q', 'Q.PLANKEY', 'P.PLANKEY')
    .leftJoin('dbo.DYBFBATCHPLANPARAMETERS as R', (builder) => {
      builder.on('R.PLANKEY', 'P.PLANKEY').andOn('R.PARAMSTRING', '=', knex.raw("'Kilo'"))
    })
    .leftJoin('dbo.BFERPPARAMETERDEFINITIONS as D', (builder) => {
      builder.on('D.MACHINEID', 'P.MACHINEIDLIST').andOn('D.PARAMID', 'R.BATCHPARAMETERID')
    })
    .where('Q.PLANKEY', null)
    .andWhere('P.ISSTARTED', 1)
    .andWhere((builder) => {
      builder.whereNull('P.ISDELETED').orWhere('P.ISDELETED', 0)
    })
    .andWhere((builder) => {
      builder.whereNull('P.ISDELETESENDTOMANUNITES').orWhere('P.ISDELETESENDTOMANUNITES', 0)
    })
    .andWhere('P.LASTFORJOBORDER', 1)
    .andWhereBetween('P.RECORDTIME', ['2023-07-01', '2023-07-08'])
  return plannedEvents
}))

export default useBase('/api/planned', router.handler)
