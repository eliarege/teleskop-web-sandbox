import { addSeconds } from 'date-fns'
import { knex } from '../../../knexConfig'
import type { TimeBasedEvents } from '../../../../types/planning-board'
import { updateTimeBasedEventStates } from './helper'

// GET
export async function getTimeBasedPlannedEvents() {
  return await knex({ p: 'dbo.PTBATCHPLANQUEUE' })
    .leftJoin('dbo.DYBFBATCHPLAN as d', 'd.PLANKEY', 'p.PLANKEY')
    .select({
      planKey: 'p.PLANKEY',
      machineId: 'p.MACHINEID',
      plannedStartTime: 'p.STARTTIME',
      jobOrder: 'd.JOBORDER',
      programNoList: 'd.PROGRAMNOLIST',
      theoreticalDuration: 'd.TheoricalDuration',
      fabricWeight: 'd.FABRICWEIGHT',
      pinned: 'p.PINNED',
      isStarted: 'd.ISSTARTED',
      isStopped: 'd.ISSTOPPED',
    }).whereNotNull('p.STARTTIME')
}
export async function getTimeBasedEvents(archiveDays: number) {
  const archiveEvents = knex.raw(`
    WITH RankedBatches AS (
      SELECT
        P.BATCHKEY as batchKey,
        p.PLANKEY AS planKey,
        p.MACHINEID AS machineId,
        p.JOBORDER AS jobOrder,
        p.PROGRAMNOLIST AS programNoList,
        p.STARTTIME AS startTime,
        CASE
          WHEN p.ENDTIME IS NULL THEN p.CANCELTIME
          ELSE p.ENDTIME
        END as endTime,
        p.THEORETICDURAT AS theoreticalDuration,
        p.FABRIC_WEIGHT AS fabricWeight,
        p.PARTYNUMBER AS partyNumber,
        p.DEVIATION as deviation,
        d.PLANNEDMACHINE as plannedMachineId,
        d.PLANNEDSTARTTIME as plannedStartTime,
        d.NOTE AS note,
        d.ISDELETED AS isDeleted,
        d.ISSTARTED AS isStarted,
        d.ISSTOPPED AS isStopped,
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
      theoreticalDuration,
      fabricWeight,
      partyNumber,
      deviation,
      plannedMachineId,
      plannedStartTime,
      note,
      isDeleted,
      isStarted,
      isStopped
    FROM RankedBatches
    WHERE RowNum = 1
`)
  return archiveEvents
}
export async function getTimeBasedTheoreticalDuration(planKey: number) {
  return await knex.raw(`
  SELECT b.MACHINEID as machineId ,SUM(B.DURATION) as theoreticalDuration
  FROM BFMASTERPRGHEADER B
  WHERE B.PROGNO IN (
      SELECT RECIPENO
      FROM DYBFBATCHORDERRECIPEHEADER
      WHERE PLANKEY = ${planKey}
    )
    group by b.MACHINEID
`)
}
// UPDATE
export async function updateTimeBasedEvents(planKey: number, machineId: number, plannedStartTime: string) {
  const theoreticalDuration = await getTimeBasedTheoreticalDuration(planKey)

  await knex.transaction(async (trx) => {
    await trx('PTBATCHPLANQUEUE')
      .update({ MACHINEID: machineId, STARTTIME: plannedStartTime })
      .where({ PLANKEY: planKey })

    await trx('DYBFBATCHPLAN')
      .update({
        MACHINEIDLIST: machineId,
        PLANNEDMACHINE: machineId,
        PLANNEDSTARTTIME: plannedStartTime,
        TheoricalDuration: theoreticalDuration.find(a => a.machineId === machineId).theoreticalDuration,
      })
      .where({ PLANKEY: planKey })

    await trx('DYBFBATCHPLANPARAMETERS')
      .update('PARAMSTRING', knex.raw('B.PARAMNAME'))
      .from('DYBFBATCHPLANPARAMETERS')
      .innerJoin({ B: 'BFERPPARAMETERDEFINITIONS' }, (builder) => {
        builder.on('PLANKEY', '=', knex.raw(planKey))
          .andOn('B.MACHINEID', '=', knex.raw(machineId))
          .andOn('B.PARAMID', '=', 'BATCHPARAMETERID')
      })
  })
}
// SAVE
export async function scheduleTimeBasedEvents(planKey: number, machineId: number, plannedStartTime: string) {
  const theoreticalDuration = await getTimeBasedTheoreticalDuration(planKey)
  const queueNumber = (await knex.raw(`SELECT TOP 1 p.QUEUENUMBER + 1 as queue FROM PTBATCHPLANQUEUE p WHERE p.MACHINEID = ${machineId} ORDER BY p.QUEUENUMBER DESC`))[0].queue

  await knex.transaction(async (trx) => {
    await trx('DYBFBATCHPLAN')
      .update({
        MACHINEIDLIST: machineId,
        PLANNEDMACHINE: machineId,
        PLANNEDSTARTTIME: plannedStartTime,
        TheoricalDuration: theoreticalDuration.find(a => a.machineId === machineId).theoreticalDuration,
      })
      .where({ PLANKEY: planKey })

    await trx('PTBATCHPLANQUEUE')
      .insert({
        PLANKEY: planKey,
        MACHINEID: machineId,
        QUEUENUMBER: queueNumber,
        STARTTIME: plannedStartTime,
      })
    await trx('DYBFBATCHPLANPARAMETERS')
      .update('PARAMSTRING', knex.raw('B.PARAMNAME'))
      .from('DYBFBATCHPLANPARAMETERS')
      .innerJoin({ B: 'BFERPPARAMETERDEFINITIONS' }, (builder) => {
        builder.on('PLANKEY', '=', knex.raw(planKey))
          .andOn('B.MACHINEID', '=', knex.raw(machineId))
          .andOn('B.PARAMID', '=', 'BATCHPARAMETERID')
      })
  })
}
// DELETE
