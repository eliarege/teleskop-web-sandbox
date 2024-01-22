import { knex } from '../../../knexConfig'
import { updateTimeBasedEventStates } from './helper'

// GET
export async function getTimeBasedPlannedEvents(from: Date | string, to: Date | string) {
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
      fabricWeight: knex.raw(`(select r.VALUE from DYBFBATCHPLANPARAMETERS r where r.PARAMSTRING = 'Kilo' and r.PLANKEY = p.PLANKEY)`),
      partyNumber: 'd.PARTYNUMBER',
      note: 'd.NOTE',
      isDeleted: 'd.ISDELETED',
      isStarted: 'd.ISSTARTED',
      isStopped: 'd.ISSTOPPED',
    })
    .leftJoin({ d: 'DYBFBATCHPLAN' }, 'd.PLANKEY', 'p.PLANKEY')
    .whereBetween('d.RECORDTIME', [from, to])
    .andWhere((builder) => {
      builder.whereNull('d.ISDELETED').orWhere('d.ISDELETED', 0)
    })
    .orderBy('p.MACHINEID')
    .orderBy('p.QUEUENUMBER')
  const modifiedEvents = events.map((e) => {
    return {
      ...e,
      plannedEndTime: new Date(new Date(e.plannedStartTime).getTime() + e.theoreticalDuration * 1000),
      isDeviaiton: e.isStarted ? new Date(e.actualStartTime) !== e.plannedStartTime : false,
    }
  })
  return updateTimeBasedEventStates(modifiedEvents)
}
// Zaman Bazlı planlamada taskin hangi makinelerde çalışabileceğini döndürür.

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

  const queueNumber = (await knex.raw(`
  SELECT TOP 1 p.QUEUENUMBER + 1 as queue
  FROM PTBATCHPLANQUEUE p
  WHERE p.MACHINEID = ${machineId}
  ORDER BY p.QUEUENUMBER DESC
  `))[0].queue

  await knex.transaction(async (trx) => {
    await trx('PTBATCHPLANQUEUE')
      .update({ MACHINEID: machineId, STARTTIME: plannedStartTime, QUEUENUMBER: queueNumber })
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
