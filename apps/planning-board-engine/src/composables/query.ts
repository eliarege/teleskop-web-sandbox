import { updateEventStates } from '../helper'
import { knex } from '../knexConfig'

export async function getPlannedEvents(from: Date | string, to: Date | string) {
  const events = await knex({ p: 'PTBATCHPLANQUEUE' })
    .select({
      planKey: 'p.PLANKEY',
      machineId: 'p.MACHINEID',
      queueNumber: 'p.QUEUENUMBER',
      recordTime: 'd.RECORDTIME',
      jobOrder: 'd.JOBORDER',
      programNoList: 'd.PROGRAMNOLIST',
      plannedStartTime: 'd.PLANNEDSTARTTIME',
      theoreticalDuration: 'd.TheoricalDuration',
      fabricWeight: 'd.FABRICWEIGHT',
      partyNumber: 'd.PARTYNUMBER',
      note: 'd.NOTE',
      isDeleted: 'd.ISDELETED',
      isStarted: 'd.ISSTARTED',
      isStopped: 'd.ISSTOPPED',
    })
    .leftJoin({ d: 'DYBFBATCHPLAN' }, 'd.PLANKEY', 'p.PLANKEY')
    .whereBetween('d.RECORDTIME', [from, to])
    .orderBy('p.MACHINEID')
    .orderBy('p.QUEUENUMBER')
  const modifiedEvents = events.map((e) => {
    return {
      ...e,
      plannedEndTime: new Date(new Date(e.plannedStartTime).getTime() + e.theoreticalDuration * 1000),
    }
  })
  return updateEventStates(modifiedEvents)
}
export async function getUnplannedEvents(from: Date | string, to: Date | string) {
  const events = await knex('dbo.DYBFBATCHPLAN as P')
    .select({
      planKey: 'P.PLANKEY',
      recordTime: 'P.RECORDTIME',
      jobOrder: 'P.JOBORDER',
      plannedMachineId: 'P.PLANNEDMACHINE',
      programCount: 'P.PRGCOUNT',
      plannedStartTime: 'P.PLANNEDSTARTTIME',
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
    .andWhereBetween('P.RECORDTIME', [from, to])
  return events
}
export async function saveChanges(changes: { updated?: any[]; deleted?: any[]; added?: any[] }) {
  if (changes.updated && changes.updated.length > 0) {
    changes.updated.forEach((el) => {
      // UPDATE
    })
  } if (changes.added && changes.added.length > 0) {
    changes.added.forEach((el) => {
      // ADD
    })
  } if (changes.deleted && changes.deleted.length > 0) {
    changes.deleted.forEach((el) => {
      // DELETE
    })
  }
}
