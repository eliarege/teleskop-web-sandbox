import type { QueueBasedPlannedEventsRaw } from '../../../../types/planning-board'
import { knex } from '../../../knexConfig'
import { updateArchiveQueueEventStates, updateRawQueueEventStates } from './helper'

// GET
export async function getQueueBasedPlannedEvents() {
  const events: QueueBasedPlannedEventsRaw[] = await knex({ p: 'PTBATCHPLANQUEUE' })
    .select({
      planKey: 'p.PLANKEY',
      machineId: 'p.MACHINEID',
      queueNumber: 'p.QUEUENUMBER',
      jobOrder: 'd.JOBORDER',
      programNoList: 'd.PROGRAMNOLIST',
      theoreticalDuration: 'd.TheoricalDuration',
      fabricWeight: knex.raw(`(select r.VALUE from DYBFBATCHPLANPARAMETERS r where r.PARAMSTRING = 'Kilo' and r.PLANKEY = p.PLANKEY)`),
      partyNumber: 'd.PARTYNUMBER',
      pinned: 'p.PINNED',
      note: 'd.NOTE',
      isDeleted: 'd.ISDELETED',
      isStarted: 'd.ISSTARTED',
      isStopped: 'd.ISSTOPPED',
      startDate: 'd.STARTDATETIME',
      color: 'd.Color',
    })
    .leftJoin({ d: 'DYBFBATCHPLAN' }, 'd.PLANKEY', 'p.PLANKEY')
    .where((builder) => {
      builder.whereNull('d.ISDELETED').orWhere('d.ISDELETED', 0)
    })
    .orderBy('p.MACHINEID')
    .orderBy('p.QUEUENUMBER')
  return updateRawQueueEventStates(events)
}
export async function getQueueBasedArchiveEvents(archiveDays: number) {
  const events = await knex.raw(`
    WITH RankedBatches AS (
      SELECT
        P.BATCHKEY as batchKey,
        p.PLANKEY AS planKey,
        p.MACHINEID AS machineId,
        p.JOBORDER AS jobOrder,
        p.PROGRAMNOLIST AS programNoList,
        p.STARTTIME AS startTime,
        p.ENDTIME as endTime,
        p.CANCELTIME as cancelTime,
        p.THEORETICDURAT AS theoreticalDuration,
        p.FABRIC_WEIGHT AS fabricWeight,
        p.PARTYNUMBER AS partyNumber,
        p.DEVIATION as deviation,
        d.NOTE AS note,
        d.ISDELETED AS isDeleted,
        d.ISSTARTED AS isStarted,
        d.ISSTOPPED AS isStopped,
        d.Color as color,
        ROW_NUMBER() OVER (PARTITION BY p.PLANKEY ORDER BY p.BATCHREFERENCE DESC) AS RowNum
      FROM
        BADATA AS p
        LEFT JOIN DYBFBATCHPLAN d ON d.PLANKEY = P.PLANKEY
      WHERE
        p.STARTTIME BETWEEN DATEADD(DAY, -${archiveDays}, GETDATE()) AND GETDATE()
        AND (d.ISDELETED IS NULL OR d.ISDELETED = 0)
        AND d.ISSTARTED = 1
    )
    SELECT
      batchKey,
      planKey,
      machineId,
      jobOrder,
      programNoList,
      startTime,
      endTime,
      cancelTime,
      theoreticalDuration,
      fabricWeight,
      partyNumber,
      deviation,
      note,
      isDeleted,
      isStarted,
      isStopped,
      color
    FROM RankedBatches
    WHERE RowNum = 1;
  `)

  return updateArchiveQueueEventStates(events)
}
export async function checkMachineLastTaskQueue(machineId: number) {
  return await knex({ p: 'PTBATCHPLANQUEUE' })
    .select({
      queueNumber: 'p.QUEUENUMBER',
    })
    .where('p.MACHINEID', '=', machineId)
    .orderBy('p.QUEUENUMBER', 'desc')
    .limit(1)
}
