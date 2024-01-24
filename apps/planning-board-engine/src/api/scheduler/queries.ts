import { calculateDeviation, updateEventStates } from '../../composables/helper'
import { knex } from '../../knexConfig'

export async function getPtStatus() {
  const res = await knex('dbo.TFTELESKOPSETTINGS as P')
    .select({
      value: 'P.value',
    }).where('ID', '=', '6')
  if (res.length > 0) {
    return res[0].value
  }
}
export async function getUnplannedEvents() {
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
export async function getMachines() {
  return await knex('dbo.BFMACHINES as b')
    .leftJoin('dbo.BFMACHGROUP as c', 'c.GROUPID', 'b.GRUPNO')
    .select({
      id: 'b.MACHINEID',
	    groupNo: 'b.GRUPNO',
	    groupName: 'c.GROUPNAME',
	    name: 'b.MACHINECODE',
	    machineCapacity: 'b.MACHINECAPACITY',
    })
    .where('b.INUSE', '=', 1)
    .andWhere('b.USEINTELESKOP', '=', 1)
}
export async function getErpParameteres(machineId: number) {
  return await knex({ p: 'dbo.BFERPPARAMETERDEFINITIONS' }).select({
    id: 'p.PARAMID',
    paramName: 'p.PARAMNAME',
    erpFieldName: 'p.ERPFIELDNAME',
  }).where('p.MACHINEID', '=', machineId)
}
export async function isTaskValid(planKey: number) {
  const taskPrgList: Set<number> = new Set(
    (
      await knex({ p: 'dbo.DYBFBATCHPLAN' })
        .select({ prgList: 'p.PROGRAMNOLIST' })
        .where('p.PLANKEY', '=', planKey)
    )[0].prgList.split(',').slice(0, -1).map(a => Number.parseInt(a)),
  )

  const machinePrgList: number[] = (
    await knex({ p: 'dbo.BFMACHINES' })
      .select({
        machineId: 'p.MACHINEID',
        programs: knex.raw(`
        (select
          CONCAT('[', STRING_AGG(PROGNO, ','), ']') list
        from BFMASTERPRGHEADER b
          where b.MACHINEID = p.MACHINEID
          for json auto, include_null_values)
      `),
      })
      .where('p.INUSE', '=', true)
      .andWhere('p.USEINTELESKOP', '=', true)
  )
  const isValid = machinePrgList.map((machine: any) => {
    const prgList: any[] = JSON.parse(machine.programs)
    return {
      machineId: machine.machineId,
      programs: [...taskPrgList].every(a => prgList[0].list.includes(a)),
    }
  })

  return isValid
}
export async function removeFromPlan(planKey: number) {
  await knex('dbo.DYBFBATCHPLAN').update({ MACHINEIDLIST: 0, PLANNEDMACHINE: 0, PLANNEDSTARTTIME: '2019-03-22 00:00:00.000' }).where('PLANKEY', '=', planKey)
  await knex('dbo.PTBATCHPLANQUEUE').where('PLANKEY', '=', planKey).del()
}
export async function deleteEvent(planKey: number) {
  await knex('dbo.DYBFBATCHPLAN').update({ ISDELETED: 1 }).where('PLANKEY', '=', planKey)
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
export async function deleteNote(id: number) {
  await knex('PTBATCHNOTES').where('NOTEKEY', '=', id).delete()
}
