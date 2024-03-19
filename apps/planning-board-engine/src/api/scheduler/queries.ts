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
      theoreticalDuration: 'P.TheoricalDuration',
      isStopped: 'P.ISSTOPPED',
      color: 'P.Color',
    })
    .leftJoin('dbo.PTBATCHPLANQUEUE as Q', 'Q.PLANKEY', 'P.PLANKEY')
    .leftJoin('dbo.DYBFBATCHPLANPARAMETERS as R', (builder) => {
      builder.on('R.PLANKEY', 'P.PLANKEY').andOn('R.PARAMSTRING', '=', knex.raw('\'Kilo\''))
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
    .orderBy('P.RECORDTIME', 'desc')
  return events.filter(ev => ev.theoreticalDuration > 0)
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
      showOnScreen: 'p.SHOWONSCREEN',
    }).where('JOBORDER', '=', jobOrder)
}
export async function getBatchProperties(machineId: number, planKey: number) {
  const erpParameters = await knex('PTERPPARAMBYUSER as p')
    .select('p.PARAMID as paramId', 'b.PARAMNAME as paramName', 'd.VALUE as value')
    .leftJoin('BFERPPARAMETERDEFINITIONS as b', 'b.PARAMID', 'p.PARAMID')
    .leftJoin('DYBFBATCHPLANPARAMETERS as d', 'd.BATCHPARAMETERID', 'p.PARAMID')
    .where('p.OWNER', 118)
    .andWhere('p.MACHINEID', machineId)
    .andWhere('d.PLANKEY', planKey)
    .groupBy('p.PARAMID', 'b.PARAMNAME', 'd.VALUE')

  const programs = await knex.raw(`
    WITH SplitValues AS (
      SELECT CAST(value AS INT) AS ProgramNo
      FROM STRING_SPLIT((SELECT LEFT(d.PROGRAMNOLIST, LEN(d.PROGRAMNOLIST) - 1) FROM DYBFBATCHPLAN d WHERE d.PLANKEY = ${planKey}), ',')
      )
    SELECT b.PROGNO, b.NAME
    FROM BFMASTERPRGHEADER b
    WHERE b.PROGNO IN (SELECT ProgramNo FROM SplitValues)
    AND b.MACHINEID = ${machineId}
    GROUP BY b.PROGNO, b.NAME;
  `)
  const times = await knex.raw(`
    SELECT TOP 1
    d.TheoricalDuration AS theoreticalDuration,
    d.STARTDATETIME AS startTime,
    d.PLANNEDSTARTTIME AS plannedStartTime,
    CASE
        WHEN b.ENDTIME IS NULL THEN b.CANCELTIME
    ELSE b.ENDTIME
  END as endTime
  FROM
    DYBFBATCHPLAN AS d
  LEFT JOIN
    BADATA AS b ON d.PLANKEY = b.PLANKEY
  WHERE
    d.PLANKEY = ${planKey};
  `)

  const subquery = knex('BFMACHBATCHPARAMETERTYPES')
    .select('PARAMID')
    .where('PARAMTYPEID', '=', 0)
    .andWhere('MACHINEID', '=', machineId)

  const summary = await knex('PTERPPARAMBYUSER as p')
    .leftJoin('DYBFBATCHPLANPARAMETERS as c', 'c.BATCHPARAMETERID', 'p.PARAMID')
    .select('c.PLANKEY as planKey', 'p.PARAMID as paramId', 'c.PARAMSTRING as paramString', 'c.VALUE as value')
    .whereIn('p.PARAMID', subquery)
    .andWhere('p.MACHINEID', machineId)
    .andWhere('c.PLANKEY', planKey)
    .groupBy('p.PARAMID', 'c.PARAMSTRING', 'c.VALUE', 'c.PLANKEY')
    .first()

  return { erpParameters, programs, times: times[0], summary }
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
  return await knex('dbo.BFMACHINES as m')
    .leftJoin('dbo.TFMACHINESTATUS as s', 'm.MACHINEID', 's.MACHINEID')
    .leftJoin('dbo.BFMACHGROUP as g', 'm.GRUPNO', 'g.GROUPID')
    .leftJoin('dbo.BADATA as b', 'b.BATCHKEY', 's.RUNNING_BATCHKEY')
    .select({
      id: 'm.MACHINEID',
      name: 'm.MACHINECODE',
      machineCapacity: 'm.MACHINECAPACITY',
      machineIpAddress: 'm.IP',
      groupName: 'g.GROUPNAME',
      elapsedTime: knex.raw('DATEDIFF(SECOND, b.STARTTIME, GETDATE())'),
      theoreticalDuration: 'b.THEORETICDURAT',
      autoManualStatus: 's.RUNNING_AUTOMANSTATUS',
      loggedInOperatorNo: 's.RUNNING_OPRNO',
      loggedInOperatorName: 's.RUNNING_OPRNAME',
      runningJobOrder: 's.RUNNING_JOBORDER',
      runningStartTime: 's.RUNNING_JOBORDERSTARTTIME',
      runningBatchKey: 's.RUNNING_BATCHKEY',
      runningBatchStatus: 's.RUNNING_BATCHSTATUS',
      runningProgramId: 's.RUNNING_PROGRAMID',
      runningProgramName: 's.RUNNING_PROGRAMNAME',
      runningProgramList: 's.RUNNING_PROGNOLIST',
      runningStepNo: 's.RUNNING_STEPNO',
      runningCommandNo: 's.RUNNING_CMDNO',
      runningCommandName: 's.RUNNING_CMDNAME',
      runningAlarmNo: 's.RUNNING_ALARMNO',
      runningAlarmName: 's.RUNNING_ALARMNAME',
      runningTheoreticalDuration: 's.RUNNING_THEOTIME',
      runningPhaseNo: 's.RUNNING_PHASENO',
      runningPhaseName: 's.RUNNING_PHASENAME',
      runningPhaseStepNo: 's.RUNNING_PHASESTEPNO',
      runningMachineCapacity: 'b.FABRIC_WEIGHT',
      reqRecipeIndex: 's.REQ_RECIPEINDEX',
      reqOrderIndex: 's.REQ_REQORDERINDEX',
      reqOperationCode: 's.REQ_OPERATIONCODE',
      reqTargetRecipe: 's.REQ_TARGETRECIPE',
      reqTankNo: 's.REQ_TANKNO',
      reqPriority: 's.REQ_PRIORITY',
      totalRequestCount: 's.REQ_TOTALREQCOUNT',
      reqProgramNo: 's.REQ_PRGNO',
      reqCommandNo: 's.REQ_CMDNO',
      reqStatus: 's.REQ_STATUS',
      stopReason: 's.stopReason',
      stopReasonDateTime: 's.stopReasonDateTime',
      connectionStatus: 's.ConnectionStatus',
      isSynchronizing: 's.IsSynchronizing',
      currentTemperature: 's.currentTemp',
      currentAlarmStatus: 's.currentAlarmStatus',
      runningCompletionRatio: 's.runningCompletionRatio',
      manualReason: 's.manuelReason',
      manualReasonDateTime: 's.manuelReasonDateTime',
      manualCommandActive: 's.MANUELCOMMANDACTIVE',
      totalAlarmCount: knex.raw(`(select count(*) from BAALARM where BAALARM.BATCHKEY = s.RUNNING_BATCHKEY and BAALARM.CONFIRMTIME is NULL)`),
    })
    .where('m.INUSE', '=', 1)
    .andWhere('m.USEINTELESKOP', '=', 1)
}
export async function getErpParameters(machineId: number) {
  const definitions = await knex({ p: 'dbo.BFERPPARAMETERDEFINITIONS' })
    .select({
      id: 'p.PARAMID',
      paramName: 'p.PARAMNAME',
      erpFieldName: 'p.ERPFIELDNAME',
    }).where('p.MACHINEID', '=', machineId)

  const plannedDefinitions = await knex({ p: 'dbo.PTERPPARAMBYUSER' })
    .leftJoin('dbo.BFERPPARAMETERDEFINITIONS as d', 'd.PARAMID', 'p.PARAMID')
    .select({
      paramId: 'p.PARAMID',
      owner: 'p.OWNER',
      machineId: 'p.MACHINEID',
      paramName: 'd.PARAMNAME',
    }).where('p.OWNER', '=', 117).andWhere('p.MACHINEID', '=', machineId)
    .groupBy('p.OWNER', 'p.PARAMID', 'd.PARAMNAME', 'p.MACHINEID')

  const unplannedDefinitions = await knex({ p: 'dbo.PTERPPARAMBYUSER' })
    .leftJoin('dbo.BFERPPARAMETERDEFINITIONS as d', 'd.PARAMID', 'p.PARAMID')
    .select({
      paramId: 'p.PARAMID',
      owner: 'p.OWNER',
      machineId: 'p.MACHINEID',
      paramName: 'd.PARAMNAME',
    }).where('p.OWNER', '=', 118).andWhere('p.MACHINEID', '=', machineId)
    .groupBy('p.OWNER', 'p.PARAMID', 'd.PARAMNAME', 'p.MACHINEID')
  return { definitions, plannedDefinitions, unplannedDefinitions }
}
export async function getEventTooltipParams(planKey: number, machineId: number) {
  const subquery = await knex('PTERPPARAMBYUSER as p')
    .select('p.PARAMID')
    .leftJoin('BFERPPARAMETERDEFINITIONS as d', 'd.PARAMID', 'p.PARAMID')
    .where('p.MACHINEID', '=', machineId)
    .andWhere('p.OWNER', '=', 117)
    .groupBy('p.PARAMID')
  return await knex('DYBFBATCHPLANPARAMETERS as b')
    .select({
      paramString: 'b.PARAMSTRING',
      value: 'b.VALUE',
    })
    .whereIn('b.BATCHPARAMETERID', subquery.map(item => item.PARAMID.toString()))
    .andWhere('b.PLANKEY', '=', planKey)
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
export async function addErpParameters(paramId: number, owner: number, machineId: number) {
  await knex('PTERPPARAMBYUSER').insert({
    USERID: 0,
    ORDERID: 0,
    PARAMID: paramId,
    OWNER: owner,
    MACHINEID: machineId,
  })
}
export async function pinEvent(planKey: number) {
  await knex('dbo.PTBATCHPLANQUEUE').update({ PINNED: 1 }).where('PLANKEY', '=', planKey)
}
export async function unpinEvent(planKey: number) {
  await knex('dbo.PTBATCHPLANQUEUE').update({ PINNED: 0 }).where('PLANKEY', '=', planKey)
}
export async function deleteNote(id: number) {
  await knex('PTBATCHNOTES').where('NOTEKEY', '=', id).delete()
}
export async function deleteErpParameters(paramId: number, owner: number, machineId: number) {
  await knex('PTERPPARAMBYUSER')
    .where('PARAMID', '=', paramId)
    .andWhere('OWNER', '=', owner)
    .andWhere('MACHINEID', '=', machineId).del()
}
export async function updateBatchNote(noteKey: number, showOnScreen: boolean) {
  await knex.transaction(async (trx) => {
    await trx('dbo.PTBATCHNOTES').update({
      SHOWONSCREEN: showOnScreen,
    }).where('NOTEKEY', '=', noteKey)
  })
}
export async function updateSchedulerEvents(body: { planKey: number, queueNumber: number, machineId: number }[]) {
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
export async function scheduleEvents(body: { planKey: number, queueNumber: number, machineId: number, plannedStartTime: string } []) {
  await knex.transaction(async (trx) => {
    const machineIdList = new Set(body.map(a => a.machineId))
    const planKeyList = new Set(body.map(a => a.planKey))
    await trx('PTBATCHPLANQUEUE').whereIn('MACHINEID', [...machineIdList]).del('PLANKEY')
    await trx('PTBATCHPLANQUEUE').whereIn('PLANKEY', [...planKeyList]).del('PLANKEY')
    for (const ev of body) {
      const theoreticalDuration = (await getTheoreticalDuration(ev.planKey)).find(a => a.machineId === ev.machineId)?.theoreticalDuration || 0
      console.log(theoreticalDuration)

      await trx('PTBATCHPLANQUEUE').where('PLANKEY', '=', ev.planKey).insert({
        PLANKEY: ev.planKey,
        QUEUENUMBER: ev.queueNumber,
        MACHINEID: ev.machineId,
        STARTTIME: ev.plannedStartTime,
      })
      await trx('DYBFBATCHPLAN')
        .where('PLANKEY', '=', ev.planKey)
        .update({
          MACHINEIDLIST: ev.machineId,
          PLANNEDMACHINE: ev.machineId,
          PLANNEDSTARTTIME: ev.plannedStartTime,
          TheoricalDuration: theoreticalDuration,
        })
      await trx('DYBFBATCHPLANPARAMETERS')
        .update('PARAMSTRING', knex.raw('B.PARAMNAME'))
        .from('DYBFBATCHPLANPARAMETERS')
        .innerJoin({ B: 'BFERPPARAMETERDEFINITIONS' }, (builder) => {
          builder.on('PLANKEY', '=', knex.raw(ev.planKey))
            .andOn('B.MACHINEID', '=', knex.raw(ev.machineId))
            .andOn('B.PARAMID', '=', 'BATCHPARAMETERID')
        })
    }
  })
}
