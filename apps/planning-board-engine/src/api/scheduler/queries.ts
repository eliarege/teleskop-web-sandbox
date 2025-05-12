import moo from 'moo'
import { TbbFtpClient } from '@teleskop/tbb-ftp-client'
import type { PlanParameters, QueueBasedEventStop } from 'types/planning-board'
import type { Program } from 'typescript'
import { chunk } from 'lodash-es'
import { config } from '~/config'
import { knex } from '~/knexConfig'
import { logger } from '~/composables/logger'

export async function refreshCustomTables() {
  // refresh PTCOLUMNS table
  const existingPtColumns = await knex('PTCOLUMNS')
    .select('parameterId', 'parameterName')

  const ptColumnsValues = await knex('DYBFBATCHPLANPARAMETERS as d')
    .distinct('d.PARAMSTRING', 'd.BATCHPARAMETERID')
    .join('BADATA as b', 'd.PLANKEY', 'b.PLANKEY')
    .where('d.PARAMSTRING', '<>', '')
    .orderBy('d.BATCHPARAMETERID', 'asc')
    .timeout(30_000)

  const newPtColumns = ptColumnsValues.filter(
    row => !existingPtColumns.some(e => e.parameterId === row.BATCHPARAMETERID),
  )

  if (newPtColumns.length > 0) {
    await knex('PTCOLUMNS').insert(
      newPtColumns.map(row => ({
        parameterId: row.BATCHPARAMETERID,
        parameterName: row.PARAMSTRING,
        visible: false,
      })),
    )
    logger.info('New values inserted into PTCOLUMNS')
  } else {
    logger.info('No new data found to insert into PTCOLUMNS')
  }

  // refresh PTMACHINEERP table
  const existingPtMachineErp = await knex('PTMACHINEERP')
    .select('paramId', 'machineId', 'paramName')

  const ptMachineErpValues = await knex('BFMACHBATCHPARAMETERS').select({
    paramId: 'BATCHPARAMETERID',
    machineId: 'MACHINEID',
    paramName: 'PARAMSTRING',
  })

  const existingParamNames = ptMachineErpValues.map(p => p.paramName)

  const missingParams = await knex('BFERPPARAMETERDEFINITIONS')
    .select('PARAMNAME', 'PARAMID', 'MACHINEID')
    .whereNotIn('PARAMNAME', existingParamNames)
    .distinct()

  const extra = missingParams.map((param) => {
    return {
      paramId: param.PARAMID,
      machineId: param.MACHINEID,
      paramName: param.PARAMNAME,
      visible: false,
    }
  })

  const newPtMachineErp = [
    ...ptMachineErpValues.map(row => ({
      paramId: row.paramId,
      machineId: row.machineId,
      paramName: row.paramName,
      visible: false,
    })),
    ...extra,
  ].filter(
    row =>
      !existingPtMachineErp.some(
        e =>
          e.paramId === row.paramId
          && e.machineId === row.machineId
          && e.paramName === row.paramName,
      ),
  )

  if (newPtMachineErp.length > 0) {
    const chunks = chunk(newPtMachineErp, 500)
    for (const ch of chunks) {
      await knex('PTMACHINEERP').insert(ch)
    }
    logger.info(`Inserted ${newPtMachineErp.length} new values into PTMACHINEERP`)
  } else {
    logger.info('No new data found to insert into PTMACHINEERP')
  }

  return logger.info('OK')
}

export async function getPtStatus() {
  const res = await knex('dbo.TFTELESKOPSETTINGS as P')
    .select({
      value: 'P.value',
    }).where('ID', '=', '6')
  if (res.length > 0) {
    return res[0].value
  }
}
export async function planningBoardStops(startDate: string, endDate: string): Promise<QueueBasedEventStop[]> {
  const stops = await knex({ b: 'BASTOPS' }).select({
    machineId: 'b.MACHINEID',
    stopNumber: 'b.STOPNUMBER',
    stopReason: 'b.STOPREASON',
    startTime: 'b.STARTTIME',
    endTime: 'b.ENDTIME',
    note: 'b.EXPLANATION',
  }).whereBetween('b.STARTTIME', [startDate, endDate])
  return stops.map(ev => ({
    eventType: 'stop',
    ...ev,
  }))
}
export async function getUnplannedEvents() {
  const events = await knex.raw(/* sql */`
        SELECT
        TOP 100
        'unplanned' as eventType,
          d.PLANKEY AS planKey,
          d.RECORDTIME AS recordTime,
          d.JOBORDER AS jobOrder,
          c.VALUE AS fabricWeight,
          d.PLANNEDMACHINE AS machineId,
          d.PRGCOUNT AS programCount,
          d.PROGRAMNOLIST AS programList,
          d.PLANNEDSTARTTIME AS startTime,
          d.NOTE AS note,
          d.TheoricalDuration AS theoreticalDuration,
          d.Color AS fabricColor,
          d.CUSTOMERNAME AS customer,
          p.QUEUENUMBER AS queueNumber,
          p.PINNED AS pinned,
          (
          SELECT v.parameterName as 'paramName', r.VALUE as 'value'
            FROM DYBFBATCHPLANPARAMETERS r
            LEFT JOIN PTCOLUMNS v ON v.parameterId = r.BATCHPARAMETERID
            WHERE r.PLANKEY = d.PLANKEY
            AND v.visible = 1
            FOR JSON PATH
            ) as erpParameters
        FROM DYBFBATCHPLAN d
        LEFT JOIN PTBATCHPLANQUEUE p ON p.PLANKEY = d.PLANKEY
        LEFT JOIN DYBFBATCHPLANPARAMETERS c ON c.PLANKEY = d.PLANKEY AND c.PARAMSTRING = 'Kilo'
    WHERE d.ISDELETED IS NULL OR d.ISDELETED = 0
    AND p.PLANKEY IS NULL
    AND d.LASTFORJOBORDER = 1
    AND d.ISDELETESENDTOMANUNITES IS NULL OR d.ISDELETESENDTOMANUNITES = 0
    ORDER BY d.RECORDTIME DESC
`)

  return events.map(ev => ({
    ...ev,
    theoreticalDuration: ev.theoreticalDuration === 0 ? 28800 : ev.theoreticalDuration,
    erpParameters: ev.erpParameters ? Object.fromEntries(JSON.parse(ev.erpParameters).map(a => [a.paramName, a.value])) : [],
  }))
}
export async function getTheoreticalDuration(planKey: number) {
  return await knex.raw(/* sql */`
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
  const erpParameters = await knex('PTMACHINEERP as p')
    .select({
      paramId: 'p.paramId',
      paramName: 'p.paramName',
      value: 'd.VALUE',
    })
    .leftJoin('DYBFBATCHPLANPARAMETERS as d', 'd.BATCHPARAMETERID', 'p.paramId')
    .where('p.machineId', machineId)
    .andWhere('p.visible', true)
    .andWhere('d.PLANKEY', planKey)
    .groupBy('p.paramId', 'p.paramName', 'd.VALUE')
    .orderBy('p.paramId')

  const programs = await knex.raw(/* sql */`
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
  const times = await knex.raw(/* sql */`
  SELECT TOP 1
    d.TheoricalDuration AS theoreticalDuration,
    d.STARTDATETIME AS startTime,
    DATEADD(MINUTE, ?, d.PLANNEDSTARTTIME) AS plannedStartTime,
    DATEADD(MINUTE, ?, IIF(b.ENDTIME IS NULL, b.CANCELTIME, b.ENDTIME)) AS endTime
  FROM
    DYBFBATCHPLAN AS d
  LEFT JOIN
    BADATA AS b ON d.PLANKEY = b.PLANKEY
  WHERE
    d.PLANKEY = ?;
  `, [config.teleskopTimezoneOffset, config.teleskopTimezoneOffset, planKey])

  return { erpParameters, programs, times: times[0] }
}
export async function getMachines(idList?: number[]) {
  const baseQuery = knex('dbo.BFMACHINES as m')
    .leftJoin('dbo.TFMACHINESTATUS as s', 'm.MACHINEID', 's.MACHINEID')
    .leftJoin('dbo.BFMACHGROUP as g', 'm.GRUPNO', 'g.GROUPID')
    .leftJoin('dbo.BADATA as b', 'b.BATCHKEY', 's.RUNNING_BATCHKEY')
    .select({
      id: 'm.MACHINEID',
      name: 'm.MACHINECODE',
      machineCapacity: 'm.MACHINECAPACITY',
      machineIpAddress: 'm.IP',
      groupName: 'g.GROUPNAME',
      elapsedTime: knex.raw('DATEDIFF(SECOND, DATEADD(MINUTE, ?, b.STARTTIME), GETDATE())', [config.teleskopTimezoneOffset]),
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
      totalAlarmCount: knex.raw(/* sql */`(select count(*) from BAALARM where BAALARM.BATCHKEY = s.RUNNING_BATCHKEY and BAALARM.CONFIRMTIME is NULL)`),
    })
    .where('m.INUSE', '=', 1)
    .andWhere('m.USEINTELESKOP', '=', 1)
  if (idList) {
    return await baseQuery.whereIn('m.MACHINEID', idList)
  } else return await baseQuery
}
export async function getMachineIds(): Promise<number[]> {
  return (await knex('BFMACHINES').select('MACHINEID as id').where('INUSE', true).andWhere('USEINTELESKOP', true)).map(m => m.id)
}

export async function getMachineInfo(id: number): Promise<{ ip: string } | undefined> {
  return await knex
    .where('INUSE', true)
    .andWhere('USEINTELESKOP', true)
    .andWhere('MACHINEID', id)
    .from('BFMACHINES')
    .first({ ip: 'IP' })
}

export async function getErpParameters(paramName: string) {
  const erpParams = await knex({ p: 'dbo.PTMACHINEERP' })
    .select('*')
    .where('p.paramName', '=', paramName)

  return erpParams.filter(e => e.visible === true).map(e => e.machineId)
}
export async function getMachinesByErpParameter(paramString: string) {
  const idList = await knex({ b: 'BFMACHBATCHPARAMETERS' })
    .select({
      machineId: 'b.MACHINEID',
    })
    .where('b.PARAMSTRING', paramString)

  // erpden gelen parametre başlangıç parametresi olarak kaydedilmemiş ise muhtemelen müşteri bunu
  // sadece planlamada göstermek istiyordur diye varsayıyoruz.
  return idList.map(i => i.machineId)
}
export async function getUnplannedColumns() {
  return await knex('PTCOLUMNS').select('*')
}
export async function getColumnData(planKey?: number) {
  if (planKey) {
    return await knex({ p: 'PTCOLUMNS' })
      .leftJoin(
        knex.select('*').from('DYBFBATCHPLANPARAMETERS').where('PLANKEY', planKey).as('d'),
        'p.parameterId',
        'd.BATCHPARAMETERID',
      )
      .select({
        value: 'd.VALUE',
        parameterId: 'p.parameterId',
      })
      .where('p.visible', true)
  } else {
    return await knex({ p: 'PTCOLUMNS' })
      .leftJoin(
        knex.select('*').from('DYBFBATCHPLANPARAMETERS').as('d'),
        'p.parameterId',
        'd.BATCHPARAMETERID',
      )
      .select({
        planKey: 'd.PLANKEY',
        value: 'd.VALUE',
        parameterId: 'p.parameterId',
      })
      .where('p.visible', true)
  }
}
export async function getDistinctErpParameters() {
  return await knex({ b: 'BFERPPARAMETERDEFINITIONS' })
    .select({ paramName: 'b.PARAMNAME', paramId: 'b.PARAMID' })
    .distinct()
}
export async function getEventTooltipParams(planKey: number, machineId: number) {
  return await knex({ p: 'PTMACHINEERP' })
    .leftJoin('BFERPPARAMETERDEFINITIONS as b', 'b.PARAMID', 'p.paramId')
    .leftJoin('DYBFBATCHPLANPARAMETERS as d', 'd.BATCHPARAMETERID', 'b.PARAMID')
    .select({
      paramName: 'p.paramName',
      value: 'd.VALUE',
    })
    .where('p.machineId', machineId)
    .andWhere('d.PLANKEY', planKey)
    .andWhere('p.visible', true)
    .groupBy(['p.paramName', 'd.VALUE'])
}
export async function taskValid(planKey: number, fabricWeight: number) {
  const [taskPrograms, taskCapacityAgainstMachines] = await Promise.all([
    validateTaskPrograms(planKey),
    validateTaskCapacityAgainstMachines(fabricWeight),
  ])
  return taskCapacityAgainstMachines.map(({ machineId, valid }) => ({
    machineId,
    valid: valid && taskPrograms.some(tp => tp.machineId === machineId && tp.valid),
  }))
}
export async function validateTaskPrograms(planKey: number) {
  const taskPrgList: Set<number> = new Set(
    (
      await knex({ p: 'dbo.DYBFBATCHPLAN' })
        .select({ prgList: 'p.PROGRAMNOLIST' })
        .where('p.PLANKEY', '=', planKey)
    )[0]?.prgList?.split(',').slice(0, -1).map(a => Number.parseInt(a)) ?? [],
  )

  const rawPrograms = await knex({ b: 'dbo.BFMASTERPRGHEADER' })
    .join({ m: 'dbo.BFMACHINES' }, 'b.MACHINEID', 'm.MACHINEID')
    .where('m.INUSE', '=', true)
    .andWhere('m.USEINTELESKOP', '=', true)
    .select({
      machineId: 'b.MACHINEID',
      programNo: 'b.PROGNO',
    })

  const machinePrgMap = rawPrograms.reduce((acc, { machineId, programNo }) => {
    if (!acc[machineId])
      acc[machineId] = new Set()
    acc[machineId].add(programNo)
    return acc
  }, {} as Record<number, Set<number>>)

  return Object.entries(machinePrgMap).map(([machineId, prgList]) => ({
    machineId: Number(machineId),
    valid: [...taskPrgList].every(a => prgList.has(a)),
  }))
}

export async function validateTaskCapacityAgainstMachines(fabricWeight: number) {
  const capacity = await knex('BFMACHINES as b')
    .select({
      machineId: 'b.MACHINEID',
      valid: knex.raw(
        `CASE WHEN b.MACHINECAPACITY >= ? THEN 1 ELSE 0 END`,
        [fabricWeight],
      ),
    },
    )
    .where('b.INUSE', 1)
    .andWhere('b.USEINTELESKOP', 1)
  return capacity.map(c => ({
    ...c,
    valid: c.valid !== 0,
  }))
}
export async function removeFromPlan(planKey: number) {
  const deletedRow = await knex('dbo.PTBATCHPLANQUEUE')
    .select('MACHINEID', 'QUEUENUMBER')
    .where('PLANKEY', planKey)
    .first()

  if (!deletedRow)
    return

  const { MACHINEID, QUEUENUMBER } = deletedRow

  await knex('dbo.DYBFBATCHPLAN')
    .update({
      MACHINEIDLIST: 0,
      PLANNEDMACHINE: 0,
      PLANNEDSTARTTIME: '2019-03-22 00:00:00.000',
    })
    .where('PLANKEY', planKey)

  await knex('dbo.PTBATCHPLANQUEUE')
    .where('PLANKEY', planKey)
    .delete()

  await knex('dbo.PTBATCHPLANQUEUE')
    .where('MACHINEID', MACHINEID)
    .andWhere('QUEUENUMBER', '>', QUEUENUMBER)
    .decrement('QUEUENUMBER', 1)
}

export async function deleteEvent(planKey: number) {
  const deletedRow = await knex('dbo.PTBATCHPLANQUEUE')
    .select('MACHINEID', 'QUEUENUMBER')
    .where('PLANKEY', planKey)
    .first()

  if (!deletedRow)
    return

  const { MACHINEID, QUEUENUMBER } = deletedRow

  await knex('dbo.DYBFBATCHPLAN')
    .update({ ISDELETED: 1 })
    .where('PLANKEY', planKey)

  await knex('dbo.PTBATCHPLANQUEUE')
    .delete()
    .where('PLANKEY', planKey)

  await knex('dbo.PTBATCHPLANQUEUE')
    .where('MACHINEID', MACHINEID)
    .andWhere('QUEUENUMBER', '>', QUEUENUMBER)
    .decrement('QUEUENUMBER', 1)
}

export async function dataCleanup() {
  await knex('PTBATCHPLANQUEUE')
    .whereIn(
      'PLANKEY',
      knex('DYBFBATCHPLAN')
        .select('PLANKEY')
        .where('ISDELETED', 1),
    )
    .del()

  const machines = await knex('PTBATCHPLANQUEUE').distinct('MACHINEID')

  for (const machine of machines) {
    const rows = await knex('PTBATCHPLANQUEUE')
      .where('MACHINEID', machine.MACHINEID)
      .orderBy('QUEUENUMBER', 'asc')

    for (let i = 0; i < rows.length; i++) {
      const newQueueNumber = i + 1
      if (rows[i].QUEUENUMBER !== newQueueNumber) {
        await knex('PTBATCHPLANQUEUE')
          .where('PLANKEY', rows[i].PLANKEY)
          .update({ QUEUENUMBER: newQueueNumber })
      }
    }
  }
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
export async function addErpParameters(id: number, machineId: number) {
  await knex('PTMACHINEERP').update({ visible: true }).where('machineId', machineId).andWhere('id', id)
}
export async function bulkAddErpParameter(paramString: string, machines: number[]) {
  const trx = await knex.transaction()

  try {
    if (machines.length > 0) {
      await trx('PTMACHINEERP')
        .update({ visible: false })
        .where('paramName', paramString)
      for (const machine of machines) {
        await trx('PTMACHINEERP')
          .update({ visible: true })
          .where('paramName', paramString)
          .andWhere('machineId', machine)
      }
    } else {
      await trx('PTMACHINEERP')
        .update({ visible: false })
        .where('paramName', paramString)
    }

    await trx.commit()
  } catch (error) {
    await trx.rollback()
    throw error
  }
}

export async function removeErpParameter(id: number, machineId: number) {
  await knex('PTMACHINEERP').update({ visible: false }).where('id', id).andWhere('machineId', machineId)
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
export async function updateUnplannedColumns(id: number, visible: boolean) {
  await knex.transaction(async (trx) => {
    await trx('PTCOLUMNS').update({
      visible,
    }).where('id', '=', id)
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
export async function hasProgram(programNo: number, machineId: number): Promise<boolean> {
  const result = await knex({ p: 'BFMASTERPRGHEADER' })
    .first('p.PROGNO')
    .where('p.PROGNO', programNo)
    .andWhere('p.MACHINEID', machineId)
  return !!result
}
export async function getDetailedProgram(programNo: number, machineId: number): Promise<Program> {
  if (!await hasProgram(programNo, machineId)) {
    throw new Error('Program Does Not Exist!')
  }
  const [program] = await knex.transaction(async (trx) => {
    return await trx
      .select({
        name: 'P.NAME',
        icon: trx.raw('CASE P.ICONNAME WHEN \'\' THEN \'null\' END'),
        programNo: 'P.PROGNO',
        author: 'P.LOCKEDBY',
        comment: 'P.USERCOMMENT',
        typeId: 'T.PROCESSCODE',
        typeName: 'T.PROCESSNAME',
        machineId: 'M.MACHINEID',
        programState: 'P.PRGSTATE',
        machineName: 'M.MACHINECODE',
        steps: trx.raw(`ISNULL((
      SELECT commands = ISNULL((
        SELECT s2.COMMANDNO AS commandNo,
        parameters = ISNULL((
          SELECT TRY_CAST(REPLACE(sp.VALUE, ',', '.')  AS FLOAT) AS value, sp.PARAMETERINDEX AS [index]
          FROM BFMASTERSTEPPARAMS sp
          WHERE s2.MACHINEID = sp.MACHINEID
            AND s2.PROGNO = sp.PROGNO
            AND s2.MAINSTEP = sp.MAINSTEP
            AND s2.PARALELSTEP = sp.PARALELSTEP
          ORDER BY sp.PARAMETERINDEX
          FOR JSON AUTO, INCLUDE_NULL_VALUES
        ), '[]'),
        ioList = ISNULL((
          SELECT sio.IOID AS ioId, sio.IOINDEX AS ioIndex,
          value = ISNULL((
            SELECT '[' + STRING_AGG('[' + CAST(sel.IOTYPE + 1 AS VARCHAR) + ',' + CAST(sel.SELECTEDIOID AS VARCHAR) + ']', ',') + ']'
              FROM BFMASTERSTEPSELECTIONLIST sel
              WHERE sel.MACHINEID = sio.MACHINEID
                AND sel.PROGNO = sio.PROGNO
                AND sel.MAINSTEP = sio.MAINSTEP
                AND sel.PARALELSTEP = sio.PARALELSTEP
                AND sel.IOINDEX = sio.IOINDEX
          ), '[]')
          FROM BFMASTERSTEPINPUTOUTPUTS sio
          WHERE s2.MACHINEID = sio.MACHINEID
            AND s2.PROGNO = sio.PROGNO
            AND s2.MAINSTEP = sio.MAINSTEP
            AND s2.PARALELSTEP = sio.PARALELSTEP
          ORDER BY sio.IOINDEX
          FOR JSON AUTO, INCLUDE_NULL_VALUES
        ), '[]')
        FROM BFMASTERSTEPS s2
        WHERE s.MACHINEID = s2.MACHINEID
          AND s.PROGNO = s2.PROGNO
          AND s.MAINSTEP = s2.MAINSTEP
        ORDER BY s2.PARALELSTEP
        FOR JSON AUTO, INCLUDE_NULL_VALUES
      ), '[]')
      FROM BFMASTERSTEPS s
      WHERE P.MACHINEID = s.MACHINEID
        AND P.PROGNO = s.PROGNO
        AND s.PARALELSTEP = 0
      ORDER BY s.MAINSTEP
      FOR JSON AUTO, INCLUDE_NULL_VALUES
      ), '[]')`),
      })
      .from('BFMASTERPRGHEADER AS P')
      .join('BFMACHINES AS M', 'M.MACHINEID', 'P.MACHINEID')
      .join('BFPROCESSTYPES AS T', 'T.PROCESSCODE', 'P.PROCESSCODE')
      .where('P.PROGNO', programNo)
      .andWhere('M.MACHINEID', machineId)
  })
  program.steps = JSON.parse(program.steps)

  for (const step of program.steps)
    for (const command of step.commands)
      for (const io of command.ioList)
        io.value = JSON.parse(io.value)

  for (let i = 0; i < program.steps.length; i++) {
    const step = program.steps[i]
    const [mainCommand, ...parallelCommands] = step.commands as ProgramStepCommand[]
    const newStep: ProgramStep = { stepId: step.stepId, mainCommand, parallelCommands }
    program.steps[i] = newStep
  }

  return program
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
function resolveParamStatus(param: PlanParameters): number {
  if ((param.paramHighLimit === undefined || param.paramHighLimit === null) && (param.paramLowLimit === undefined || param.paramLowLimit === null)) {
    return 3
  } else if (param.value === null) {
    return 2
    // @ts-expect-error TODO: fix types
  } else if (param.value > param.paramHighLimit || param.value < param.paramLowLimit || param.value === null) {
    return 1
  } else return 0
}

export async function checkMachineParameterRequest(machineId: number): Promise<boolean> {
  const value = await knex.column('ParamValue')
    .select()
    .where('ParamToken', 'IS_EMRI_BASLATILIRKEN_TUM_PARAMETRELERI_SOR')
    .andWhere('MachineId', machineId)
    .from('BFMACHINESYSTEMPARAMS')

  return value[0].ParamValue === '1'
}
export async function getPlanParameters(planKey: number, machineId: number) {
  let parameters: PlanParameters[]
  const machineRequest = await checkMachineParameterRequest(machineId)
  if (machineRequest) {
    parameters = await knex({ b: 'BFMACHBATCHPARAMETERS' })
      .leftJoin('DYBFBATCHPLANPARAMETERS as d', function () {
        this.on('b.PARAMSTRING', '=', 'd.PARAMSTRING')
          .andOn('d.PLANKEY', knex.raw('?', [98085]))
      })
      .select({
        machineId: 'b.MACHINEID',
        paramString: 'b.PARAMSTRING',
        value: 'd.VALUE',
        unitCode: 'b.UNITCODE',
        paramHighLimit: 'b.PARAMHIGHLIMIT',
        paramLowLimit: 'b.PARAMLOWLIMIT',
      })
      .where('b.MACHINEID', machineId)
  } else {
    parameters = await knex({ d: 'DYBFBATCHPLANPARAMETERS' })
      .leftJoin('BFMACHBATCHPARAMETERS as b', (builder) => {
        builder.on('b.PARAMSTRING', 'd.PARAMSTRING')
          .andOn('b.MACHINEID', knex.raw('?', [machineId]))
      })
      .select({
        machineId: 'b.MACHINEID',
        paramString: 'd.PARAMSTRING',
        value: 'd.VALUE',
        unitCode: 'd.UNITCODE',
        paramHighLimit: 'b.PARAMHIGHLIMIT',
        paramLowLimit: 'b.PARAMLOWLIMIT',
      })
      .where('d.PLANKEY', planKey)
  }

  return parameters.map(param => ({
    paramStatus: resolveParamStatus(param),
    ...param,
  }))
}

export async function updatePlanParameter(planKey: number, value: number, paramString: string) {
  await knex.transaction(async (trx) => {
    await trx('DYBFBATCHPLANPARAMETERS').update({
      VALUE: value,
    })
      .where('PLANKEY', planKey)
      .andWhere('PARAMSTRING', paramString)
  })
}
export async function createPlanParameter(parameter: {
  paramString: string
  value?: number | string
  planKey: string
  paramLowLimit: number
  paramHighLimit: number
  paramStatus: number
}, value: number | string, machineId: number) {
  const planReference = await knex({ d: 'DYBFBATCHPLANPARAMETERS' })
    .select('*')
    .orderBy('BATCHPARAMETERID', 'desc')
    .first()

  const batchReference = await knex({ b: 'BFMACHBATCHPARAMETERS' })
    .select('*')
    .where('b.PARAMSTRING', parameter.paramString)
    .andWhere('b.MACHINEID', '=', machineId)
    .first()
  await knex.transaction(async (trx) => {
    await trx('DYBFBATCHPLANPARAMETERS').insert({
      JOBORDER: planReference.JOBORDER,
      PLANKEY: parameter.planKey,
      BATCHPARAMETERID: planReference.BATCHPARAMETERID + 1,
      PARAMSTRING: parameter.paramString,
      VALUE: value,
      PARAMETERTYPE: batchReference.PARAMETERTYPE,
      UNITCODE: batchReference.UNITCODE,
      ADDEDWITHDEFAULT: 0,
    })
  })
}

export async function getFormula(program: string, machineId: number) {
  const progNoList = program.split(',').map(Number)
  const commandFormulas = await knex('BFCOMMANDPARAMETERS')
    .distinct('VALUE as value')
    .where('MACHINEID', machineId)
    .whereIn('COMMANDNO', (builder) => {
      builder.select('COMMANDNO')
        .distinct()
        .from('BFMASTERSTEPS')
        .where('MACHINEID', machineId)
        .whereIn('PROGNO', progNoList)
    })
    .andWhere('TBBFORMUL', 1)

  const selectedFormulas = await knex({ prm: 'BFMASTERSTEPPARAMS' })
    .distinct('frm.formula as value')
    .innerJoin('BFMASTERSTEPS as stps', (builder) => {
      builder.on('prm.MACHINEID', 'stps.MACHINEID')
        .andOn('prm.PROGNO', 'stps.PROGNO')
        .andOn('prm.MAINSTEP', 'stps.MAINSTEP')
        .andOn('prm.PARALELSTEP', 'stps.PARALELSTEP')
    })
    .innerJoin('BFCOMMANDPARAMETERS as cmd', (builder) => {
      builder.on('prm.MACHINEID', '=', 'cmd.MACHINEID')
        .andOn('stps.COMMANDNO', '=', 'cmd.COMMANDNO')
        .andOn('prm.PARAMETERINDEX', '=', 'cmd.PARAMETERINDEX')
    })
    .innerJoin('BFCOMMANDFORMULAS as frm', (builder) => {
      builder.on('prm.MACHINEID', '=', 'frm.machineId')
        .andOn('prm.VALUE', '=', 'frm.formulaId')
    })
    .where('cmd.USEFORMULA', 1)
    .andWhere('prm.MACHINEID', machineId)
    .andWhere('stps.PROGNO', 'in', progNoList)
    .andWhere('stps.COMMANDNO', 'in', knex.select('COMMANDNO')
      .from('BFCOMMANDPARAMETERS')
      .where('MACHINEID', machineId)
      .andWhere('COMMANDNO', 'in', knex.select(knex.raw('DISTINCT(COMMANDNO) as cmdNo'))
        .from('BFMASTERSTEPS')
        .where('MACHINEID', machineId)
        .andWhere('PROGNO', 'in', progNoList))
      .andWhere('USEFORMULA', 1))

  const formula = [...selectedFormulas, ...commandFormulas]
  return (await formulaStartingParams(parseFormulas(formula.map(e => e.value)), machineId))
}

export function parseFormulas(formulas: string[]) {
  const lexer = moo.compile({
    operator: ['+', '-', '*', '/', '(', ')'],
    number: /0|[1-9][0-9]*/,
    variable: /[a-zA-Z0-9_.\u0080-\u00FF\u0100-\u017F ]+/,
    NL: { match: /\n/, lineBreaks: true },
  })

  const tokens: string[] = []

  formulas.forEach((formula) => {
    lexer.reset(formula)
    for (const token of lexer) {
      if (token.type === 'variable') {
        tokens.push(token.value)
      }
    }
  })
  return tokens
}

export async function formulaStartingParams(formulas: string[], machineId: number) {
  return await knex({ b: 'BFMACHBATCHPARAMETERS' })
    .select({
      machineId: 'b.MACHINEID',
      paramString: 'b.PARAMSTRING',
      paramLowLimit: 'b.PARAMLOWLIMIT',
      paramHighLimit: 'b.PARAMHIGHLIMIT',
    })
    .where('b.MACHINEID', machineId)
    .whereIn('b.PARAMSTRING', formulas)
}

export async function getStartingParametersWithValues(params: {
  machineId: number
  paramString: string
  paramLowLimit: number
  paramHighLimit: number
}[], planKey: number): Promise<{ paramString: string, value: string | number | null }[]> {
  const formattedValues = params.map(param => `('${param.paramString}')`).join(', ')
  const parameters = await knex.raw(/* sql */`
    select
        v.PARAMSTRING as paramString,
        d.VALUE as value
    from
        (values
            ${formattedValues}
        ) v (PARAMSTRING)
    left join DYBFBATCHPLANPARAMETERS d
        on v.PARAMSTRING = d.PARAMSTRING and d.PLANKEY = ${planKey}
  `)
  const enrichedParameters = parameters.map(e => ({
    ...e,
    planKey,
    paramLowLimit: params.find(ev => ev.paramString === e.paramString)?.paramLowLimit || 0,
    paramHighLimit: params.find(ev => ev.paramString === e.paramString)?.paramHighLimit || 0,
  }))
  return enrichedParameters.map(e => ({
    ...e,
    paramStatus: resolveParamStatus(e),
  }))
}
function txtFormat(data: {
  batchStart: Date
  batchType: number
  programCount: number
  parameters: {
    paramString: string
    value: string | number
  }[]
  programs: string[]
}) {
  const lines = []

  lines.push(`BATCH_START=${data.batchStart.toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/ /g, ' ')}`)
  lines.push(`BATCH_TYPE=${data.batchType}`)
  lines.push(`PROGRAM_COUNT=${data.programCount}`)

  data.parameters.forEach((param) => {
    lines.push(`${param.paramString}=${param.value}`)
  })

  data.programs.forEach((program, index) => {
    lines.push(`Program${index + 1}=${program}`)
  })

  return `${lines.join('\n')}\n`
}
export async function uploadToMachine(machineIp: string, startingParams: { paramString: string, value: string | number }[], programNoList: string, jobOrder: string) {
  const programs = programNoList.split(',')
  const txt = {
    batchStart: new Date(),
    // TODO: check batch types
    batchType: 0,
    programCount: programs.length,
    parameters: startingParams,
    programs,
  }

  const file = txtFormat(txt)
  const ftp = new TbbFtpClient(machineIp)
  try {
    await ftp.connect()
    await ftp.upload(`/tbb6500/client/remoteBatch/plan/${jobOrder}.txt`, file)
    return 'DONE!'
  } catch (err) {
    return console.error(err)
  }
}
