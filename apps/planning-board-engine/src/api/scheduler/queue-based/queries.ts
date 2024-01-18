import { addDays, addSeconds } from 'date-fns'
import { updateEventStates } from '../../../composables/helper'
import { knex } from '../../../knexConfig'

// GET
export async function getQueueBasedPlannedEvents(from: Date | string, to: Date | string) {
  const events = await knex({ p: 'PTBATCHPLANQUEUE' })
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
    .whereBetween('d.RECORDTIME', [from, to])
    .andWhere((builder) => {
      builder.whereNull('d.ISDELETED').orWhere('d.ISDELETED', 0)
    })
    .orderBy('p.MACHINEID')
    .orderBy('p.QUEUENUMBER')
  const modifiedEvents = events.filter(a => a.theoreticalDuration !== 0 && a.theoreticalDuration !== null).map((ev) => {
    return {
      ...ev,
      plannedEndTime: addSeconds(ev.plannedStartTime, ev.theoreticalDuration),
      isDeviaiton: ev.isStarted ? new Date(ev.actualStartTime) !== ev.plannedStartTime : false,
    }
  })
  return updateEventStates(modifiedEvents)
}
export async function getQueueBasedArchiveEvents(archiveDays: number) {
  const events = await knex({ p: 'DYBFBATCHPLAN' })
    .select({
      planKey: 'p.PLANKEY',
      machineId: 'p.MACHINEIDLIST',
      jobOrder: 'p.JOBORDER',
      programNoList: 'p.PROGRAMNOLIST',
      plannedStartTime: 'p.PLANNEDSTARTTIME',
      actualStartTime: 'p.STARTDATETIME',
      theoreticalDuration: 'p.TheoricalDuration',
      fabricWeight: 'p.FABRICWEIGHT',
      partyNumber: 'p.PARTYNUMBER',
      note: 'p.NOTE',
      isDeleted: 'p.ISDELETED',
      isStarted: 'p.ISSTARTED',
      isStopped: 'p.ISSTOPPED',
    })
    .whereBetween('p.RECORDTIME', [addDays(new Date(), -archiveDays), new Date()])
    .andWhere((builder) => {
      builder.whereNull('p.ISDELETED').orWhere('p.ISDELETED', 0)
    })
    .andWhere('p.ISSTARTED', '=', 1)
  const modifiedEvents = events.map((ev) => {
    return {
      ...ev,
      plannedEndTime: addSeconds(ev.plannedStartTime, ev.theoreticalDuration),
      actualEndTime: addSeconds(ev.actualStartTime, ev.theoreticalDuration),
      isDeviaiton: ev.isStarted ? new Date(ev.actualStartTime) !== ev.plannedStartTime : false,
      isArchive: true,
    }
  },
  )
  const actualEvents = modifiedEvents.map(({ plannedStartTime, plannedEndTime, ...rest }) => ({ ...rest }))
  const plannedEvents = modifiedEvents.map(({ actualStartTime, actualEndtime, ...rest }) => ({ ...rest }))
  const mergedEvents = [...actualEvents, ...plannedEvents]
  return updateEventStates(mergedEvents)
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
