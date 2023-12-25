import { updateEventStates } from '../composables/helper'
import { knex } from '../knexConfig'

// GET
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
      programList: 'P.PROGRAMNOLIST',
      plannedStartTime: 'P.PLANNEDSTARTTIME',
      fabricWeight: 'R.VALUE',
      note: 'P.NOTE',
      erpFieldName: 'D.ERPFIELDNAME',
      batchParameterId: 'R.BATCHPARAMETERID',
      theoreticalDuration: knex.raw(`
    (SELECT SUM(B.DURATION)
    FROM BFMASTERPRGHEADER B
    WHERE B.MACHINEID = (
      select p.INTVALUE from PTSETTINGS p
      where p.USERID = -1 and p.SETTINGID = 5
    )
      AND B.PROGNO IN (SELECT RECIPENO FROM DYBFBATCHORDERRECIPEHEADER WHERE PLANKEY = P.PLANKEY))
`),
      isStopped: 'P.ISSTOPPED',
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
export async function getRecipe(machineId: string, jobOrder: string) {
  const autoRecipe = await knex.select(
    'p.RCPINDEX AS recIndex',
    'p.RECIPENO AS recNo',
    'h.NAME AS name',
    'DYEREQUESTNUMBER AS reqNumber',
    'MAINSTEP AS mainStep',
    'PARALLELSTEP AS parallelStep',
    'r.RECIPETYPE AS recType',
    'CHEMCODE AS chemCode',
    'm.MATERIALNAME AS materialName',
    'AMOUNT AS amount',
    'REQNO_BATCH AS reqBatchNo',
    'REQNO_PROG AS reqProgNo',
    'PHASENO AS phaseNo',
    'PHASEINDEX as phaseIndex',
    'otherUnit as unit',
  )
    .from('DYBFBATCHORDERRECIPESTEPS as r')
    .rightJoin('DYBFBATCHORDERRECIPEHEADER as p', (builder) => {
      builder.on('r.PLANKEY', '=', 'p.PLANKEY')
        .andOn('r.RCPINDEX', '=', 'p.RCPINDEX')
        .andOn('r.RECIPETYPE', '=', 'p.RECIPETYPE')
    })
    .leftJoin('BFMASTERPRGHEADER as h', 'p.RECIPENO', '=', 'h.PROGNO')
    .leftJoin('DYTFMATERIAL as m', 'm.MATERIALCODE', '=', 'r.CHEMCODE')
    .where('h.MACHINEID', '=', machineId)
    .whereIn('p.PLANKEY', (builder) => {
      builder.select('PLANKEY').from('DYBFBATCHPLAN').where('JOBORDER', '=', jobOrder).orderBy('PLANKEY', 'desc').limit(1)
    })
    .whereNotNull('REQNO_BATCH')
    .orderBy(['p.RCPINDEX', 'DYEREQUESTNUMBER', 'PARALLELSTEP'])

  const manualRecipe = await knex.select(
    'p.RCPINDEX AS recIndex',
    'p.RECIPENO AS recNo',
    'h.NAME AS name',
    'DYEREQUESTNUMBER AS reqNumber',
    'MAINSTEP AS mainStep',
    'PARALLELSTEP AS parallelStep',
    'r.RECIPETYPE AS recType',
    'CHEMCODE AS chemCode',
    'm.MATERIALNAME AS materialName',
    'AMOUNT AS amount',
    'REQNO_BATCH AS reqBatchNo',
    'REQNO_PROG AS reqProgNo',
    'otherUnit as unit',
  )
    .from('DYBFBATCHORDERRECIPEMANUALS as r')
    .leftJoin('DYBFBATCHORDERRECIPEHEADER as p', (builder) => {
      builder.on('r.PLANKEY', '=', 'p.PLANKEY')
        .andOn('r.RCPINDEX', '=', 'p.RCPINDEX')
    })
    .leftJoin('BFMASTERPRGHEADER as h', 'p.RECIPENO', '=', 'h.PROGNO')
    .leftJoin('DYTFMATERIAL as m', 'm.MATERIALCODE', '=', 'r.CHEMCODE')
    .where('h.MACHINEID', '=', machineId)
    .whereIn('p.PLANKEY', (builder) => {
      builder.select('PLANKEY').from('DYBFBATCHPLAN').where('JOBORDER', '=', jobOrder).orderBy('PLANKEY', 'desc').limit(1)
    })
    .whereNotNull('REQNO_BATCH')
    .where('AMOUNT', '!=', 0)
    .orderBy(['p.RCPINDEX', 'DYEREQUESTNUMBER', 'PARALLELSTEP'])
  return { autoRecipe, manualRecipe }
}
export async function isTaskValid(planKey: number) {
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
export async function getTheoreticalDuration(planKey: number) {
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
export async function getBatchNotes(jobOrder: string) {
  return await knex({ p: 'dbo.PTBATCHNOTES' })
    .leftJoin({ b: 'dbo.BFUSERS' }, 'b.userID', 'p.USERID')
    .select({
      id: 'p.NOTEKEY',
      userName: 'b.userName',
      jobOrder: 'p.JOBORDER',
      note: 'p.NOTE',
      noteDate: 'p.NOTEDATE',
    }).where('JOBORDER', '=', jobOrder)
}
export async function getPlanParameters(planKey: number) {
  return await knex({ p: 'dbo.DYBFBATCHPLANPARAMETERS' })
    .select({
      id: 'p.BATCHPARAMETERID',
      paramString: 'p.PARAMSTRING',
      value: 'p.VALUE',
    })
    .where('p.PLANKEY', '=', planKey)
}
export async function getErpParameteres(machineId: number) {
  return await knex({ p: 'dbo.BFERPPARAMETERDEFINITIONS' }).select({
    id: 'p.PARAMID',
    paramName: 'p.PARAMNAME',
    erpFieldName: 'p.ERPFIELDNAME',
  }).where('p.MACHINEID', '=', machineId)
}
//  UPDATE
export async function updateEvents(planKey: number, machineId: number, plannedStartTime: string) {
  const theoreticalDuration = await getTheoreticalDuration(planKey)

  const queueNumber = (await knex.raw(`
  SELECT TOP 1 p.QUEUENUMBER + 1 as queue
  FROM PTBATCHPLANQUEUE p
  WHERE p.MACHINEID = ${machineId}
  ORDER BY p.QUEUENUMBER DESC
`))[0].queue

  await knex('PTBATCHPLANQUEUE')
    .update({ MACHINEID: machineId, STARTTIME: plannedStartTime, QUEUENUMBER: queueNumber })
    .where({ PLANKEY: planKey })

  await knex('DYBFBATCHPLAN')
    .update({
      MACHINEIDLIST: machineId,
      PLANNEDMACHINE: machineId,
      PLANNEDSTARTTIME: plannedStartTime,
      TheoricalDuration: theoreticalDuration.find(a => a.machineId === machineId).theoreticalDuration,
    })
    .where({ PLANKEY: planKey })
  await knex('DYBFBATCHPLANPARAMETERS')
    .update('PARAMSTRING', knex.raw('B.PARAMNAME'))
    .from('DYBFBATCHPLANPARAMETERS')
    .innerJoin({ B: 'BFERPPARAMETERDEFINITIONS' }, (builder) => {
      builder.on('PLANKEY', '=', knex.raw(planKey))
        .andOn('B.MACHINEID', '=', knex.raw(machineId))
        .andOn('B.PARAMID', '=', 'BATCHPARAMETERID')
    })
}
export async function removeFromPlan(planKey: number) {
  await knex('dbo.DYBFBATCHPLAN').update({ MACHINEIDLIST: 0, PLANNEDMACHINE: 0, PLANNEDSTARTTIME: '2019-03-22 00:00:00.000' }).where('PLANKEY', '=', planKey)
  await knex('dbo.PTBATCHPLANQUEUE').where('PLANKEY', '=', planKey).del()
}
export async function addBatchNote(jobOrder: string, note: string, userId: number, showOnScreen: boolean) {
  await knex('dbo.PTBATCHNOTES').insert({
    JOBORDER: jobOrder,
    NOTE: note,
    NOTEDATE: new Date(),
    USERID: userId,
    USERTYPE: 1,
    SHOWONSCREEN: showOnScreen,
  })
}
// SAVE
export async function scheduleEvents(planKey: number, machineId: number, plannedStartTime: string) {
  const theoreticalDuration = await getTheoreticalDuration(planKey)
  const queueNumber = (await knex.raw(`SELECT TOP 1 p.QUEUENUMBER + 1 as queue FROM PTBATCHPLANQUEUE p WHERE p.MACHINEID = ${machineId} ORDER BY p.QUEUENUMBER DESC`))[0].queue
  await knex('DYBFBATCHPLAN')
    .update({
      MACHINEIDLIST: machineId,
      PLANNEDMACHINE: machineId,
      PLANNEDSTARTTIME: plannedStartTime,
      TheoricalDuration: theoreticalDuration.find(a => a.machineId === machineId).theoreticalDuration,
    })
    .where({ PLANKEY: planKey })

  await knex('PTBATCHPLANQUEUE')
    .insert({
      PLANKEY: planKey,
      MACHINEID: machineId,
      QUEUENUMBER: queueNumber,
      STARTTIME: plannedStartTime,
    })
  await knex('DYBFBATCHPLANPARAMETERS')
    .update('PARAMSTRING', knex.raw('B.PARAMNAME'))
    .from('DYBFBATCHPLANPARAMETERS')
    .innerJoin({ B: 'BFERPPARAMETERDEFINITIONS' }, (builder) => {
      builder.on('PLANKEY', '=', knex.raw(planKey))
        .andOn('B.MACHINEID', '=', knex.raw(machineId))
        .andOn('B.PARAMID', '=', 'BATCHPARAMETERID')
    })
}
// DELETE
export async function deleteEvent(planKey: number) {
  await knex('dbo.DYBFBATCHPLAN').update({ ISDELETED: 1 }).where('PLANKEY', '=', planKey)
}
export async function bulkDeleteEvents(planKeys: number[]) {
  for (const key in planKeys) {
    await knex('dbo.DYBFBATCHPLAN p').update({ ISDELETED: 1 }).where('p.planKey', '=', key)
  }
}
export async function deleteNote(id: number) {
  await knex('PTBATCHNOTES').where('NOTEKEY', '=', id).delete()
}
