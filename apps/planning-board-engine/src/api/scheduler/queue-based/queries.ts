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
      note: 'd.NOTE',
      isDeleted: 'd.ISDELETED',
      isStarted: 'd.ISSTARTED',
      isStopped: 'd.ISSTOPPED',
    })
    .leftJoin({ d: 'DYBFBATCHPLAN' }, 'd.PLANKEY', 'p.PLANKEY')
    .andWhere((builder) => {
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
      isStopped
    FROM RankedBatches
    WHERE RowNum = 1;
  `)

  return updateArchiveQueueEventStates(events)
}
export async function isTaskValidQueueBased(planKey: number) {
  const taskPrgList: Set<number> = new Set(
    (
      await knex({ p: 'dbo.DYBFBATCHPLAN' })
        .select({ prgList: 'p.PROGRAMNOLIST' })
        .where('p.PLANKEY', '=', planKey)
    )[0].prgList.split(',').slice(0, -1).map(a => Number.parseInt(a)),
  )
  const allMachineIds: number[] = (
    await knex({ p: 'dbo.BFMASTERPRGHEADER' })
      .leftJoin({ d: 'dbo.BFMACHINES' }, 'p.MACHINEID', 'd.MACHINEID')
      .select({ machineId: 'p.MACHINEID' })
      .where('d.INUSE', '=', 1)
      .andWhere('d.USEINTELESKOP', '=', 1)
      .groupBy('p.MACHINEID')
  ).map(row => row.machineId)

  const promises = allMachineIds.map(async (machineId) => {
    const machinePrgList: Set<number> = new Set(
      (
        await knex({ p: 'dbo.BFMASTERPRGHEADER' })
          .select({
            prgList: knex.raw("CONCAT('[', STRING_AGG(PROGNO, ','), ']')"),
          })
          .where('MACHINEID', '=', machineId)
          .groupBy('MACHINEID')
      )[0].prgList
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map(a => Number.parseInt(a)),
    )

    const isValid = [...taskPrgList].every(a => machinePrgList.has(a))
    return { machineId, valid: isValid }
  })

  return Promise.all(promises)
}
export async function getQueueBasedTheoreticalDuration(planKey: number) {
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
export async function checkMachineLastTaskQueue(machineId: number) {
  return await knex({ p: 'PTBATCHPLANQUEUE' })
    .select({
      queueNumber: 'p.QUEUENUMBER',
    })
    .where('p.MACHINEID', '=', machineId)
    .orderBy('p.QUEUENUMBER', 'desc')
    .limit(1)
}
// UPDATE
export async function updateQueueBasedEvents(body: { planKey: number; queueNumber: number; machineId: number }[]) {
  await knex.transaction(async (trx) => {
    const machineIdList = new Set(body.map(a => a.machineId))
    const planKeyList = new Set(body.map(a => a.planKey))
    await trx('PTBATCHPLANQUEUE').whereIn('MACHINEID', [...machineIdList]).del()
    // değiştirdiğimiz event, resource'a ait tek event ise previousResource.events.lenght 0 geliyor ve bu yüzden
    // machineIdList içerisinde sadece targetResource.id bulunuyor. Bu yüzden ek olarak planKey'e göre de silmemiz gerekiyor.
    await trx('PTBATCHPLANQUEUE').whereIn('PLANKEY', [...planKeyList]).del()
    for (const ev of body) {
      await trx('PTBATCHPLANQUEUE').where('PLANKEY', '=', ev.planKey).insert({
        PLANKEY: ev.planKey,
        QUEUENUMBER: ev.queueNumber,
        MACHINEID: ev.machineId,
        PINNED: 0,
        STARTTIME: null,
        STATE: 0,
      })
    }
  })
}
// SAVE
export async function scheduleQueueBasedEvents(planKey: number, machineId: number, plannedStartTime: string) {
  const theoreticalDuration = await getQueueBasedTheoreticalDuration(planKey)
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
