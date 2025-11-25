import moo from 'moo'
import { TbbFtpClient } from '@teleskop/tbb-ftp-client'
import type { PlanParameter, QueueBasedActualEvent, QueueBasedBaseEvent, QueueBasedEventStop, StartingParameter, ValidatedPlanParameter } from 'types/planning-board'
import { chunk } from 'lodash-es'
import type { TonelloApi, TonelloBatch } from '@teleskop/core'
import { isDef } from '@teleskop/utils'
import { config } from '~/config'
import { knex } from '~/knexConfig'
import { logger } from '~/composables/logger'
import { BatchParameterType, StartingParameters } from '~/composables/enums'
import { getManyMachineProgram, parseProgramListString } from '~/lib/program'
import { getMachineCommands } from '~/lib/command'
import { createTonelloBatch } from '~/lib/batch'
import { tryParseNumber } from '~/lib/utils'
import { getMachineInfo, isTonello } from '~/lib/machine'

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
      'unplanned' as eventType,
      d.PLANKEY AS planKey,
      d.RECORDTIME AS recordTime,
      d.JOBORDER AS jobOrder,
      ERPVALUE AS fabricWeight,
      d.PLANNEDMACHINE AS machineId,
      d.PRGCOUNT AS programCount,
      d.PROGRAMNOLIST AS programList,
      d.PLANNEDSTARTTIME AS startTime,
      d.NOTE AS note,
      d.TheoricalDuration AS theoreticalDuration,
      d.Color AS fabricColor,
      d.CUSTOMERNAME AS customer,
      null AS queueNumber,
      null AS pinned,
      (
          SELECT v.parameterName as 'paramName', r.VALUE as 'value'
          FROM DYBFBATCHPLANPARAMETERS r
          LEFT JOIN PTCOLUMNS v ON v.parameterId = r.BATCHPARAMETERID
          WHERE r.PLANKEY = d.PLANKEY
          AND v.visible = 1
          FOR JSON PATH
      ) as erpParameters
    FROM DYBFBATCHPLAN d
    LEFT JOIN DYBFBATCHPLANERPPARAMETERS c ON c.PLANKEY = d.PLANKEY AND c.ERPFIELDNAME = 'Weight'
    WHERE d.ISDELETED IS NULL OR d.ISDELETED = 0
    AND d.PLANKEY not in (select PLANKEY from PTBATCHPLANQUEUE)
    AND d.LASTFORJOBORDER = 1
    AND d.ISDELETESENDTOMANUNITES IS NULL OR d.ISDELETESENDTOMANUNITES = 0
    AND d.CORRECTIONNUMBER = (
      SELECT MAX(d2.CORRECTIONNUMBER)
      FROM DYBFBATCHPLAN d2
      WHERE d2.JOBORDER = d.JOBORDER
    )
    ORDER BY d.RECORDTIME DESC
  `) as {
    eventType: string
    planKey: number
    recordTime: Date
    jobOrder: string
    fabricWeight: number
    machineId: number
    programCount: number
    programList: string
    startTime: Date
    note: string
    theoreticalDuration: number
    fabricColor: string
    customer: string
    queueNumber: number | null
    pinned: number | null
    erpParameters: string
  }[]

  return events.map(ev => ({
    ...ev,
    theoreticalDuration: ev.theoreticalDuration === 0 ? 28800 : ev.theoreticalDuration,
    erpParameters: ev.erpParameters
      ? Object.fromEntries(
        (JSON.parse(ev.erpParameters) as { paramName: string, value: string }[])
          .map(a => [a.paramName, a.value]),
      )
      : {},
  }))
}
export async function getTheoreticalDuration(planKey: number) {
  return await knex.raw(/* sql */`
    SELECT b.MACHINEID as machineId, SUM(B.DURATION) as theoreticalDuration
    FROM BFMASTERPRGHEADER B
    WHERE B.PROGNO IN (
      SELECT RECIPENO
      FROM DYBFBATCHORDERRECIPEHEADER
      WHERE PLANKEY = :planKey
    )
    GROUP BY b.MACHINEID`, { planKey }) as {
    machineId: number
    theoreticalDuration: number
  }[]
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
    'r.AMOUNT AS amount',
    't.AMOUNT AS weighedAmount',
    'REQNO_BATCH AS reqBatchNo',
    'REQNO_PROG AS reqProgNo',
    'PHASENO AS phaseNo',
    'PHASEINDEX as phaseIndex',
    'r.otherUnit as unit',
  )
    .from('DYBFBATCHORDERRECIPESTEPS as r')
    .rightJoin('DYBFBATCHORDERRECIPEHEADER as p', (builder) => {
      builder.on('r.PLANKEY', '=', 'p.PLANKEY')
        .andOn('r.RCPINDEX', '=', 'p.RCPINDEX')
        .andOn('r.RECIPETYPE', '=', 'p.RECIPETYPE')
    })
    .leftJoin('BFMASTERPRGHEADER as h', 'p.RECIPENO', '=', 'h.PROGNO')
    .leftJoin('DYTACONSUMPTION as t', (b) => {
      b.on('t.MATERIALCODE', '=', 'r.CHEMCODE')
      b.andOn('t.JOBORDERCODE', '=', 'r.JOBORDER')
      b.andOn('t.programOrder', '=', 'r.RCPINDEX')
    })
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
    'r.AMOUNT AS amount',
    't.AMOUNT AS weighedAmount',
    'REQNO_BATCH AS reqBatchNo',
    'REQNO_PROG AS reqProgNo',
    'r.otherUnit as unit',
  )
    .from('DYBFBATCHORDERRECIPEMANUALS as r')
    .leftJoin('DYBFBATCHORDERRECIPEHEADER as p', (builder) => {
      builder.on('r.PLANKEY', '=', 'p.PLANKEY')
        .andOn('r.RCPINDEX', '=', 'p.RCPINDEX')
    })
    .leftJoin('BFMASTERPRGHEADER as h', 'p.RECIPENO', '=', 'h.PROGNO')
    .leftJoin('DYTACONSUMPTION as t', (b) => {
      b.on('t.MATERIALCODE', '=', 'r.CHEMCODE')
      b.andOn('t.JOBORDERCODE', '=', 'r.JOBORDER')
      b.andOn('t.programOrder', '=', 'r.RCPINDEX')
    })
    .leftJoin('DYTFMATERIAL as m', 'm.MATERIALCODE', '=', 'r.CHEMCODE')
    .where('h.MACHINEID', '=', machineId)
    .whereIn('p.PLANKEY', (builder) => {
      builder.select('PLANKEY').from('DYBFBATCHPLAN').where('JOBORDER', '=', jobOrder).orderBy('PLANKEY', 'desc').limit(1)
    })
    .whereNotNull('REQNO_BATCH')
    .where('r.AMOUNT', '!=', 0)
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

async function programQuery({ isActual, planKey, batchKey, machineId }: {
  isActual: boolean
  planKey?: number
  batchKey?: number
  machineId: number
}) {
  if (isActual) {
    return await knex.raw(/* sql */`
      WITH SplitValues AS (
  SELECT CAST(value AS INT) AS ProgramNo
  FROM STRING_SPLIT(
    (SELECT LEFT(b.PROGRAMNOLIST, LEN(b.PROGRAMNOLIST) - 1)
     FROM BADATA b
     WHERE b.BATCHKEY = :batchKey),
    ','
  )
),
actualDuration AS (
  SELECT
    c.PRGNO,
    c.BATCHKEY,
    DATEDIFF(SECOND, MIN(c.STARTTIME), MAX(c.ENDTIME)) AS duration
  FROM BADATA b
  LEFT JOIN BAACTUALPRGSTEPS c ON c.BATCHKEY = b.BATCHKEY
  WHERE b.BATCHKEY = :batchKey
    AND b.MACHINEID = :machineId
  GROUP BY c.BATCHKEY, c.PRGNO
)
SELECT
  b.PROGNO as prgNo,
  b.NAME as prgName,
  b.DURATION AS theoreticalDuration,
  ad.duration AS actualDuration,
  IIF(t.RUNNING_PROGRAMID = b.PROGNO, CAST(1 AS BIT), CAST(0 AS BIT)) AS currentlyRunning
FROM BFMASTERPRGHEADER b
LEFT JOIN actualDuration ad ON ad.PRGNO = b.PROGNO
LEFT JOIN TFMACHINESTATUS t ON t.MACHINEID = :machineId
WHERE b.PROGNO IN (SELECT ProgramNo FROM SplitValues)
  AND b.MACHINEID = :machineId
GROUP BY b.PROGNO, b.NAME, b.DURATION, ad.duration, t.RUNNING_PROGRAMID;
      `, { batchKey, machineId })
  } else {
    return await knex.raw(/* sql */`
WITH SplitValues AS (
  SELECT CAST(value AS INT) AS ProgramNo
  FROM STRING_SPLIT(
    (SELECT LEFT(d.PROGRAMNOLIST, LEN(d.PROGRAMNOLIST) - 1)
     FROM DYBFBATCHPLAN d
     WHERE d.PLANKEY = :planKey),
    ','
  )
)
SELECT
  b.PROGNO as prgNo,
  b.NAME as prgName,
  b.DURATION AS theoreticalDuration,
  0 AS actualDuration,
  IIF(t.RUNNING_PROGRAMID = b.PROGNO, CAST(1 AS BIT), CAST(0 AS BIT)) AS currentlyRunning
FROM BFMASTERPRGHEADER b
LEFT JOIN TFMACHINESTATUS t ON t.MACHINEID = :machineId
WHERE b.PROGNO IN (SELECT ProgramNo FROM SplitValues)
  AND b.MACHINEID = :machineId
GROUP BY b.PROGNO, b.NAME, b.DURATION, t.RUNNING_PROGRAMID;
  `, { planKey, machineId })
  }
}

export async function getBatchProperties(machineId: number, planKey: number, isActual: boolean, batchKey?: number) {
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

  if (isActual && !batchKey) {
    throw new Error('batchKey is required when isActual is true')
  }
  const programs = await programQuery({ isActual, planKey, batchKey, machineId })

  const times = await knex.raw(/* sql */`
  SELECT TOP 1
    d.TheoricalDuration AS theoreticalDuration,
    DATEADD(MINUTE, :timezoneOffset, d.STARTDATETIME) AS startTime,
    DATEADD(MINUTE, :timezoneOffset, d.PLANNEDSTARTTIME) AS plannedStartTime,
    DATEADD(MINUTE, :timezoneOffset, IIF(b.ENDTIME IS NULL, b.CANCELTIME, b.ENDTIME)) AS endTime
  FROM
    DYBFBATCHPLAN AS d
  LEFT JOIN
    BADATA AS b ON d.PLANKEY = b.PLANKEY
  WHERE
    d.PLANKEY = :planKey;
  `, { timezoneOffset: config.teleskopTimezoneOffset, planKey })

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
  const result: {
    machineId: number
    valid: boolean
    capacityWarning: boolean
    validPrograms: boolean
    validCapacity: boolean
  }[] = []

  for (const tp of taskPrograms.result) {
    const validPrograms = tp.valid
    const matchedCapacity = taskCapacityAgainstMachines
      .find(tc => tc.machineId === tp.machineId)
    const validCapacity = matchedCapacity?.valid || false

    result.push({
      machineId: tp.machineId,
      valid: validPrograms && validCapacity,
      capacityWarning: matchedCapacity?.warning || false,
      validPrograms,
      validCapacity,
    })
  }

  return {
    expectedPrograms: taskPrograms.expectedPrograms,
    expectedCapacity: fabricWeight,
    result,
  }
}

export async function validateTaskPrograms(planKey: number) {
  const res = await knex({ p: 'dbo.DYBFBATCHPLAN' })
    .first({ programList: 'p.PROGRAMNOLIST' })
    .where('p.PLANKEY', '=', planKey) as { programList: string } | undefined

  const batchProgramList = [...new Set(res?.programList
    .split(',')
    .slice(0, -1)
    .map(a => Number.parseInt(a))
    .filter(a => !Number.isNaN(a)),
  )]

  const rawPrograms = await knex({ m: 'dbo.BFMACHINES' })
    .leftJoin({ b: 'dbo.BFMASTERPRGHEADER' }, 'b.MACHINEID', 'm.MACHINEID')
    .where('m.INUSE', '=', true)
    .andWhere('m.USEINTELESKOP', '=', true)
    .select({
      machineId: 'm.MACHINEID',
      programNo: 'b.PROGNO',
    })

  const machineProgramMap = rawPrograms.reduce<Record<number, Set<number>>>((acc, { machineId, programNo }) => {
    if (!acc[machineId])
      acc[machineId] = new Set()
    if (programNo !== null)
      acc[machineId].add(programNo)
    return acc
  }, {} as Record<number, Set<number>>)

  return {
    expectedPrograms: batchProgramList,
    result: Object.entries(machineProgramMap).map(([machineId, programList]) => ({
      machineId: Number(machineId),
      valid: batchProgramList.every(prg => programList.has(prg)),
    })),
  }
}

export async function validateTaskCapacityAgainstMachines(fabricWeight: number) {
  const tolerance = 0.1
  const capacity = await knex('BFMACHINES as b')
    .select({
      machineId: 'b.MACHINEID',
      machineCapacity: 'b.MACHINECAPACITY',
    })
    .where('b.INUSE', 1)
    .andWhere('b.USEINTELESKOP', 1)

  return capacity.map((mc) => {
    const toleratedCapacity = mc.machineCapacity * (1 + tolerance)
    return ({
      machineId: mc.machineId,
      valid: toleratedCapacity >= fabricWeight,
      warning: mc.machineCapacity < fabricWeight,
    })
  })
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
  await knex('PTMACHINEERP')
    .update({ visible: true })
    .where('machineId', machineId)
    .andWhere('id', id)
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
      const theoreticalDuration = (await getTheoreticalDuration(ev.planKey))
        .find(a => a.machineId === ev.machineId)?.theoreticalDuration || 0

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

/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
function verifyParameter(param: PlanParameter): StartingParameters {
  const { paramHighLimit, paramLowLimit, value } = param

  const hasNoLimits = !isDef(paramHighLimit) && !isDef(paramLowLimit)

  if (hasNoLimits || typeof value === 'string') {
    return StartingParameters.NonStartingParameter
  } else if (!isDef(value)) {
    return StartingParameters.Changed
  } else if (value > paramHighLimit || value < paramLowLimit) {
    return StartingParameters.Invalid
  } else {
    return StartingParameters.Correct
  }
}

export async function isEveryStartParameterRequired(machineId: number): Promise<boolean> {
  const res = await knex
    .select('ParamValue')
    .from('BFMACHINESYSTEMPARAMS')
    .where('ParamToken', 'IS_EMRI_BASLATILIRKEN_TUM_PARAMETRELERI_SOR')
    .andWhere('MachineId', machineId)

  // Tonello makinelerde bu sistem parametresi yok.
  if (res.length === 0) {
    return false
  } else {
    return res[0].ParamValue === '1'
  }
}

export async function getEveryPlanParameter(planKey: number, machineId: number): Promise<ValidatedPlanParameter[]> {
  const rawParameters = await knex
    .from('BFMACHBATCHPARAMETERS as b')
    .leftJoin('BFMACHBATCHPARAMETERTYPES as pt', function () {
      this.on('b.MACHINEID', 'pt.MACHINEID')
        .andOn('b.BATCHPARAMETERID', 'pt.PARAMID')
    })
    .leftJoin(
      knex('DYBFBATCHPLANPARAMETERS')
        .where('PLANKEY', planKey)
        .as('d'),
      'b.PARAMSTRING',
      'd.PARAMSTRING',
    )
    .select({
      machineId: 'b.MACHINEID',
      paramString: 'b.PARAMSTRING',
      paramHighLimit: 'b.PARAMHIGHLIMIT',
      paramLowLimit: 'b.PARAMLOWLIMIT',
      paramType: 'pt.PARAMTYPEID',
      value: 'd.VALUE',
    })
    .where('b.MACHINEID', machineId) as {
    machineId: number
    paramString: string
    paramHighLimit: number
    paramLowLimit: number
    paramType: number | null
    value: string | null
  }[]

  const parameters = rawParameters.map(rp => ({
    ...rp,
    value: rp.value ? tryParseNumber(rp.value) : null,
  } as PlanParameter))

  return parameters.map(param => ({
    ...param,
    paramStatus: verifyParameter(param),
  })).filter(p => p.paramStatus !== StartingParameters.NonStartingParameter)
}

export async function getPlanParameters(planKey: number, machineId: number): Promise<ValidatedPlanParameter[]> {
  const machineInfo = await getMachineInfo(machineId)
  if (!machineInfo) {
    throw new Error(`Machine with id ${machineId} not found`)
  }
  const machineRequest = isTonello(machineInfo) || await isEveryStartParameterRequired(machineId)
  if (machineRequest) {
    return await getEveryPlanParameter(planKey, machineId)
  } else {
    const programList = await getPlannedProgramList(planKey)
    const startingParameters = await getRequiredStartingParametersForPrograms(programList, machineId)
    const startingParameterWithValues = await getStartingParametersWithValues(startingParameters, planKey)

    return startingParameterWithValues
  }
}

async function getPlannedProgramList(planKey: number): Promise<number[]> {
  const res = await knex({ p: 'DYBFBATCHPLAN' })
    .first({ programList: 'p.PROGRAMNOLIST' })
    .where('p.PLANKEY', planKey) as { programList: string } | undefined

  if (!res) {
    throw new Error(`Plan with key ${planKey} not found`)
  }

  const programList = parseProgramListString(res.programList)
  if (!programList) {
    throw new Error(`Invalid program list string for planKey ${planKey} (${res.programList})`)
  }

  return programList
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
export async function bulkUpsertPlanParameters(
  planKey: number,
  machineId: number,
  parameters: Array<{
    parameter: PlanParameter
    value: number | string
  }>,
) {
  await knex.transaction(async (trx) => {
    const [jobOrder, batchParams] = await Promise.all([
      trx('DYBFBATCHPLAN')
        .first({ code: 'JOBORDER' })
        .where('PLANKEY', planKey)
        .andWhere('lastForJoborder', 1),

      trx('BFMACHBATCHPARAMETERS as p')
        .leftJoin('DYBFBATCHPLANPARAMETERS as d', function () {
          this.on('p.PARAMSTRING', 'd.PARAMSTRING')
            .andOn('d.PLANKEY', '=', knex.raw(planKey))
        })
        .select({
          id: 'p.BATCHPARAMETERID',
          paramString: 'p.PARAMSTRING',
          paramType: 'p.PARAMETERTYPE',
          unitCode: 'p.UNITCODE',
          hasValue: knex.raw('CASE WHEN d.VALUE IS NOT NULL THEN 1 ELSE 0 END'),
        })
        .where('p.MACHINEID', machineId)
        .whereIn('p.PARAMSTRING', parameters.map(p => p.parameter.paramString)),
    ])

    if (!jobOrder) {
      throw new Error(`Job order not found for planKey: ${planKey}`)
    }

    const insertData = batchParams
      .filter(bp => !bp.hasValue)
      .map((bp) => {
        const value = parameters.find(p => p.parameter.paramString === bp.paramString)?.value
        if (!value) {
          throw new Error(`${bp.paramString} parameter value required`)
        }

        return {
          JOBORDER: jobOrder.code,
          PLANKEY: planKey,
          BATCHPARAMETERID: bp.id,
          PARAMSTRING: bp.paramString,
          VALUE: value,
          PARAMETERTYPE: bp.paramType,
          UNITCODE: bp.unitCode,
          ADDEDWITHDEFAULT: 0,
        }
      })

    if (insertData.length > 0) {
      await trx('DYBFBATCHPLANPARAMETERS').insert(insertData)
    }

    // Update existing parameters
    const updateData = batchParams
      .filter(bp => bp.hasValue)
      .map((bp) => {
        const newValue = parameters.find(p => p.parameter.paramString === bp.paramString)?.value
        if (!newValue) {
          throw new Error(`${bp.paramString} parameter value required`)
        }

        return {
          VALUE: newValue,
          PLANKEY: planKey,
          PARAMSTRING: bp.paramString,
        }
      })

    for (const ud of updateData) {
      await trx('DYBFBATCHPLANPARAMETERS')
        .update({ VALUE: ud.VALUE })
        .where('PLANKEY', ud.PLANKEY)
        .andWhere('PARAMSTRING', ud.PARAMSTRING)
    }
  })

  return await getPlanParameters(planKey, machineId)
}

/**
 * Belirtilen program numaralarından makine için gerekli olan başlangıç parametrelerini döner.
 * Bunu programların içerisinde kullanılan formülleri parse eder ve içinde kullanılan başlangıç
 * parametrelerini bulur.
 *
 * @param programNoList
 * @param machineId
 * @returns Programlar için gerekli Başlangıç parametreleri
 */
export async function getRequiredStartingParametersForPrograms(programNoList: number[], machineId: number) {
  const commandFormulas = await knex('BFCOMMANDPARAMETERS')
    .distinct('VALUE as value')
    .where('MACHINEID', machineId)
    .whereIn('COMMANDNO', (builder) => {
      builder.select('COMMANDNO')
        .distinct()
        .from('BFMASTERSTEPS')
        .where('MACHINEID', machineId)
        .whereIn('PROGNO', programNoList)
    })
    .andWhere('TBBFORMUL', 1)

  // Find formulas that are actually used in the program steps (in-memory operation)
  // Step 1: Get step parameters with their command numbers (join steps and params in one query)
  const stepParamsWithCommands = await knex('BFMASTERSTEPS as stps')
    .innerJoin('BFMASTERSTEPPARAMS as prm', (builder) => {
      builder.on('stps.MACHINEID', 'prm.MACHINEID')
        .andOn('stps.PROGNO', 'prm.PROGNO')
        .andOn('stps.MAINSTEP', 'prm.MAINSTEP')
        .andOn('stps.PARALELSTEP', 'prm.PARALELSTEP')
    })
    .select({
      commandNo: 'stps.COMMANDNO',
      parameterIndex: 'prm.PARAMETERINDEX',
      value: 'prm.VALUE',
    })
    .where('stps.MACHINEID', machineId)
    .whereIn('stps.PROGNO', programNoList)

  // Step 2: Get command parameter definitions where USEFORMULA=1
  const commandParams = await knex('BFCOMMANDPARAMETERS')
    .select({
      commandNo: 'COMMANDNO',
      parameterIndex: 'PARAMETERINDEX',
    })
    .where('MACHINEID', machineId)
    .where('USEFORMULA', 1)

  // Step 3: Get all available formulas
  const allFormulas = await knex('BFCOMMANDFORMULAS')
    .select('formulaId', 'formula')
    .where('machineId', machineId)

  // In-memory filtering to find formula IDs that are actually used
  const formulaIds = new Set<number>()

  for (const stepParam of stepParamsWithCommands) {
    // Check if this parameter uses a formula
    const usesFormula = commandParams.some(
      cp => cp.commandNo === stepParam.commandNo
      && cp.parameterIndex === stepParam.parameterIndex,
    )

    if (usesFormula && stepParam.value) {
      formulaIds.add(Number(stepParam.value))
    }
  }

  // Get the actual formula strings
  const selectedFormulas = allFormulas
    .filter(f => formulaIds.has(f.formulaId))
    .map(f => ({ value: f.formula }))

  const formula = [...selectedFormulas, ...commandFormulas]
  const variables = extractVariablesFromFormulas(formula.map(e => e.value))
  const startingParams = await getStartingParametersByName(variables, machineId)

  return startingParams
}

export function extractVariablesFromFormulas(formulas: string[]) {
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

export async function getStartingParametersByName(params: string[], machineId: number) {
  return await knex
    .from({ b: 'BFMACHBATCHPARAMETERS' })
    .join({ pt: 'BFMACHBATCHPARAMETERTYPES' }, function () {
      this.on('b.MACHINEID', 'pt.MACHINEID')
        .andOn('b.BATCHPARAMETERID', 'pt.PARAMID')
    })
    .select({
      machineId: 'b.MACHINEID',
      paramString: 'b.PARAMSTRING',
      paramLowLimit: 'b.PARAMLOWLIMIT',
      paramHighLimit: 'b.PARAMHIGHLIMIT',
      paramType: 'pt.PARAMTYPEID',
    })
    .where('b.MACHINEID', machineId)
    .whereIn('b.PARAMSTRING', params) as StartingParameter[]
}
/**
 * Belirtilen başlangıç parametrelerine plan için atanmış değerleri ekler ve değerleri doğrular.
 */
export async function getStartingParametersWithValues(params: StartingParameter[], planKey: number): Promise<ValidatedPlanParameter[]> {
  if (params.length === 0) {
    return []
  }

  const parameterValues = await knex
    .from('DYBFBATCHPLANPARAMETERS')
    .select({
      paramString: 'PARAMSTRING',
      value: 'VALUE',
    })
    .where('PLANKEY', planKey)
    .whereIn('PARAMSTRING', params.map(p => p.paramString))

  const parametersWithValues = params.map((param) => {
    const matchedValue = parameterValues.find(pv => pv.paramString === param.paramString)
    return {
      ...param,
      value: matchedValue ? tryParseNumber(matchedValue.value) : null,
    }
  }) as PlanParameter[]

  const validatedParameters = parametersWithValues.map(param => ({
    ...param,
    paramStatus: verifyParameter(param),
  }))

  return validatedParameters.filter(p => p.paramStatus !== StartingParameters.NonStartingParameter)
}
function txtFormat(data: {
  batchStart: Date
  batchType: number
  programCount: number
  parameters: {
    paramString: string
    value: string | number | null
  }[]
  programsNoList: number[]
}) {
  const lines = []

  lines.push(`BATCH_START=${data.batchStart.toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace(/ /g, ' ')}`)
  lines.push(`BATCH_TYPE=${data.batchType}`)
  lines.push(`PROGRAM_COUNT=${data.programCount}`)

  data.parameters.forEach((param) => {
    if (isDef(param.value)) {
      lines.push(`${param.paramString}=${param.value}`)
    }
  })

  data.programsNoList.forEach((program, index) => {
    lines.push(`Program${index + 1}=${program}`)
  })

  return `${lines.join('\n')}\n`
}
export async function uploadToMachine(
  machineIp: string,
  startingParams: { paramString: string, value: string | number | null }[],
  programNoList: number[],
  jobOrder: string,
) {
  const file = txtFormat({
    batchStart: new Date(),
    batchType: 0,
    programCount: programNoList.length,
    parameters: startingParams,
    programsNoList: programNoList,
  })
  const ftp = new TbbFtpClient(machineIp)
  try {
    await ftp.connect()
    await ftp.upload(`/tbb6500/client/remoteBatch/plan/${jobOrder}.txt`, file)
    return 'DONE!'
  } finally {
    ftp.close()
  }
}
export async function getAutoAdd(): Promise<boolean> {
  const result = await knex('DYCTCTSCONFIG').select('AUTOADDTOPLANQUEUE').first()
  return result?.AUTOADDTOPLANQUEUE
}
export async function updateAutoAdd(value: boolean) {
  await knex('DYCTCTSCONFIG').update('AUTOADDTOPLANQUEUE', value)
}

export async function uploadToTonelloMachine(
  machineId: number,
  tonelloApi: TonelloApi,
  programNos: number[],
  jobOrder: string,
  planParameters: ValidatedPlanParameter[],
) {
  let body: TonelloBatch | undefined
  await knex.transaction(async (trx) => {
    const commands = await getMachineCommands(trx, machineId)
    const programs = await getManyMachineProgram(trx, machineId, programNos)
    const sortedPrograms = programNos.map(no => programs.find(p => p.programNo === no)!)
    const weightParam = planParameters.find(p => p.paramType === BatchParameterType.FabricWeight)
    if (!weightParam || typeof weightParam.value !== 'number') {
      throw new Error(`Issue while uploading job order ${jobOrder} to Tonello machine ${machineId}: `
        + 'Fabric weight parameter is required for Tonello machines and must be a number')
    }

    body = createTonelloBatch(sortedPrograms, commands, jobOrder, weightParam.value)
  })
  if (body) {
    await tonelloApi.submitBatch(body)
  }
}
