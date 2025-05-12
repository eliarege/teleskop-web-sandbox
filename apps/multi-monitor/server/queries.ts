import { knex } from './knexConfig'
import type { BatchLogs, Interventions, MachineAlarm, MachineAlarmList, MachineAlarmStats, Recipe, Trends } from '~/shared/types'

export async function getMachineAlarms(): Promise<MachineAlarm[]> {
  const machineCommandAlarms = await knex.raw(/* sql */`
    SELECT
      m.MACHINEID AS machineId,
      m.MACHINECODE AS machineName,
      commands = (
        SELECT
          c.COMMANDNO AS commandNo,
          c.NAME AS commandName,
          alarms = (
            SELECT
              a.ALARMNO AS alarmNo,
              a.ALARM AS alarmName,
              a.SHOWONSCREEN AS showOnScreen
            FROM BFMASTERCOMMANDSALARMS AS a
            WHERE a.MACHINEID = m.MACHINEID
              AND a.COMMANDNO = c.COMMANDNO
            ORDER BY a.ALARMNO
            FOR JSON PATH
          )
        FROM BFMASTERCOMMANDS AS c
        WHERE c.MACHINEID = m.MACHINEID
        ORDER BY c.COMMANDNO
        FOR JSON PATH
    )
    FROM BFMACHINES AS m
    WHERE m.USEINTELESKOP = 1 AND m.INUSE = 1
    ORDER BY m.MACHINEID
  `)

  for (const machine of machineCommandAlarms) {
    machine.commands = JSON.parse(machine.commands)
  }

  return machineCommandAlarms
}

export async function getMachineAlarmList(): Promise<MachineAlarmList[]> {
  const queryResults = await knex.raw(`
    SELECT
      m.MACHINEID AS machineId,
      m.MACHINECODE AS machineName,
      m.IP as machineIpAddress,
      s.RUNNING_OPRNAME AS loggedInOperatorName,
      s.RUNNING_JOBORDER AS jobOrder,
      s.RUNNING_BATCHKEY AS batchKey,
      s.RUNNING_CMDNO AS runningCommandNo,
      s.currentTemp as currentTemperature,
      s.currentAlarmStatus,
      d.COMMANDNO as commandNo,
      d.EXPLANATION as alarmName,
      d.ALARMNO as alarmNo,
      d.STARTTIME as alarmStartTime,
      f.SHOWONSCREEN as showOnScreen,
      CASE
        WHEN d.CONFIRMTIME IS NOT NULL THEN 1
        ELSE 0
      END AS alarmStatus
    FROM BFMACHINES m
    LEFT JOIN TFMACHINESTATUS s ON m.MACHINEID = s.MACHINEID
    LEFT JOIN BFMACHGROUP g ON m.GRUPNO = g.GROUPID
    LEFT JOIN BADATA b ON b.BATCHKEY = s.RUNNING_BATCHKEY
    LEFT JOIN BAALARM d ON d.BATCHKEY = s.RUNNING_BATCHKEY
    LEFT JOIN BFMASTERCOMMANDSALARMS f ON f.COMMANDNO = d.COMMANDNO AND d.ALARMNO = f.ALARMNO AND f.MACHINEID = s.MACHINEID
    WHERE m.INUSE = 1
      AND m.USEINTELESKOP = 1
      AND (d.ENDTIME IS NULL OR d.ENDTIME > GETUTCDATE())
      AND (s.currentAlarmStatus = 0 OR s.currentAlarmStatus = 1)
    ORDER BY d.STARTTIME
  `)
  const machinesMap = new Map<number, MachineAlarmList>()

  for (const row of queryResults) {
    const {
      machineName,
      machineId,
      batchKey,
      jobOrder,
      loggedInOperatorName,
      currentTemperature,
      commandNo,
      alarmNo,
      alarmName,
      alarmStartTime,
      showOnScreen,
      alarmStatus,
    } = row

    if (!machinesMap.has(machineId)) {
      machinesMap.set(machineId, {
        machineId,
        machineName,
        batchKey,
        jobOrder,
        operatorName: loggedInOperatorName,
        currentTemperature,
        alarmList: [],
      })
    }

    if (commandNo !== null) {
      const machine = machinesMap.get(machineId)
      if (machine) {
        machine.alarmList.push({
          commandNo,
          alarmNo,
          alarmName,
          alarmStartTime,
          showOnScreen,
          alarmStatus,
        })
      }
    }
  }

  return (Array.from(machinesMap.values())
    .filter(machine => machine.alarmList.length > 0)).sort((a, b) => a.machineId > b.machineId ? 1 : -1)
}

export async function updateMachineAlarmVisibility(machineId: number, commandNo: number, alarmNo: number, showOnScreen: boolean) {
  await knex('BFMASTERCOMMANDSALARMS')
    .where({
      MACHINEID: machineId,
      COMMANDNO: commandNo,
      ALARMNO: alarmNo,
    })
    .update({
      SHOWONSCREEN: showOnScreen,
    })
}

export async function getLastDayAlarmCount(): Promise<MachineAlarmStats> {
  const result = await knex({ b: 'BAALARM' })
    .count('* as alarmsInLast24Hours')
    .where('b.STARTTIME', knex.raw('DATEADD(DAY, -1, GETUTCDATE())'))
    .first()

  return { alarmsInLast24Hours: result?.alarmsInLast24Hours as number }
}

export async function getCurrentRunningIndex(batchKey: number) {
  const runningIndex = await knex.raw(/* sql */
  `
    SELECT
      COUNT(DISTINCT PRGNO) AS currentRunningPrgIndex
    FROM BAACTUALPRGSTEPS
    WHERE BATCHKEY = ? AND PARALLELSTEPNO = 0
  `,
  [batchKey],
  )
  return runningIndex[0]
}

export async function getTrendData(): Promise<Trends> {
  const currentWeekData = await knex('BACONSUMPTION AS c')
    .select({
      currentWeekTotalWater: knex.raw('COALESCE(SUM(c.WaterTotal), 0)'),
      currentWeekElectricity: knex.raw('COALESCE(SUM(c.ELECTRICITY), 0)'),
      currentWeekFM: knex.raw('COALESCE(SUM(c.FM1VALUE), 0)'),
      currentWeekSalt: knex.raw('COALESCE(SUM(c.SALT), 0)'),
      currentWeekSteam: knex.raw('COALESCE(SUM(c.STEAM), 0)'),
    })
    .innerJoin(
      knex('BADATA AS r').select('r.BATCHKEY', 'r.STARTTIME').as('r'),
      'c.BATCHKEY',
      'r.BATCHKEY',
    )
    .whereBetween('r.STARTTIME', [
      knex.raw('dateadd(day, (2 - datepart(weekday, getdate())), cast(getdate() as date))'),
      knex.raw('dateadd(day,(2 - datepart(weekday, getdate())),cast(getdate()+7 AS date))'),
    ])

  const lastWeekData = await knex('BACONSUMPTION AS c')
    .select({
      lastWeekTotalWater: knex.raw('COALESCE(SUM(c.WaterTotal), 0)'),
      lastWeekElectricity: knex.raw('COALESCE(SUM(c.ELECTRICITY), 0)'),
      lastWeekFM: knex.raw('COALESCE(SUM(c.FM1VALUE), 0)'),
      lastWeekSalt: knex.raw('COALESCE(SUM(c.SALT), 0)'),
      lastWeekSteam: knex.raw('COALESCE(SUM(c.STEAM), 0)'),
    })
    .innerJoin(
      knex('BADATA AS r').select('r.BATCHKEY', 'r.STARTTIME').as('r'),
      'c.BATCHKEY',
      'r.BATCHKEY',
    )
    .whereBetween('r.STARTTIME', [
      knex.raw('dateadd(day,(2 - datepart(weekday, dateadd(week, -1, getdate()))),cast(dateadd(week, -1, getdate()) AS date))'),
      knex.raw('dateadd(day,(2 - datepart(weekday, getdate())),cast(getdate() as date))'),
    ])
  return {
    ...currentWeekData[0],
    ...lastWeekData[0],
  }
}

export async function getTeleskopSettings(): Promise<boolean> {
  const res = await knex('TFTELESKOPSETTINGS as t')
    .select({
      id: 'ID',
      value: 'VALUE',
    }).where('ID', 2)
    .first()
  return res.value === 1
}

export async function getOperatorInterventions(machineId: number): Promise<Interventions> {
  return await knex('TFMACHINESTATUS as s')
    .leftJoin('BAINTERVENTION as b', 's.RUNNING_BATCHKEY', 'b.BATCHKEY')
    .select([
      'b.INTERVENTKEY as interventKey',
      'b.INTERVENTTIME as interventTime',
      'b.MACHINEID as machineId',
      'b.BATCHKEY as batchKey',
      'b.EVENTID as eventId',
      'b.P1 as pOne',
      'b.P2 as pTwo',
      'b.P3 as pThree',
      'b.EXPLANATION as explanation',
    ])
    .where('s.MACHINEID', machineId)
}

export async function getMachineLogs(machineId: number): Promise<BatchLogs> {
  return await knex('DYBFBATCHORDERRECIPESTEPLOGS as d')
    .select([
      'd.ID as id',
      'd.PLANKEY as planKey',
      'd.MACHINEID as machineId',
      'd.JOBORDER as jobOrder',
      'd.PROGRAMINDEX as programIndex',
      'd.PROGRAMNO as programNo',
      'd.RECIPETYPE as recipeType',
      'd.REQUESTPROGRAMINDEX as requestprogramIndex',
      'd.STATUS as status',
      'd.EVENTTIME as eventTime',
      'd.EXPLANATION as explanation',
    ])
    .where('d.MACHINEID', machineId)
}

function getLatestPlanKey(jobOrder: string) {
  return knex('DYBFBATCHPLAN')
    .select('PLANKEY')
    .where('JOBORDER', jobOrder)
    .orderBy('PLANKEY', 'desc')
    .limit(1)
}

export async function getWashingRecipe(recipeJB: string, recipeID: number): Promise<Recipe[]> {
  const planKeyQuery = getLatestPlanKey(recipeJB)

  const autoRecipe = knex('DYBFBATCHORDERRECIPESTEPS as r')
    .rightJoin('DYBFBATCHORDERRECIPEHEADER as p', (builder) => {
      builder.on('r.PLANKEY', '=', 'p.PLANKEY')
        .andOn('r.RCPINDEX', '=', 'p.RCPINDEX')
        .andOn('r.RECIPETYPE', '=', 'p.RECIPETYPE')
    })
    .leftJoin('BFMASTERPRGHEADER as h', (builder) => {
      builder.on('p.RECIPENO', '=', 'h.PROGNO')
        .andOn('h.MACHINEID', '=', knex.raw(recipeID))
    })
    .leftJoin('DYTFMATERIAL as m', (builder) => {
      builder.on('m.MATERIALCODE', '=', 'r.CHEMCODE')
    })
    .select([
      'p.RCPINDEX as recIndex',
      'p.RECIPENO as recNo',
      'h.NAME as name',
      'DYEREQUESTNUMBER as reqNumber',
      'MAINSTEP as mainStep',
      'PARALLELSTEP as parallelStep',
      'r.RECIPETYPE as recType',
      'CHEMCODE as chemCode',
      'm.MATERIALNAME as materialName',
      'AMOUNT as amount',
      'REQNO_BATCH as reqBatchNo',
      'REQNO_PROG as reqProgNo',
      'PHASENO as phaseNo',
      'PHASEINDEX as phaseIndex',
      'otherUnit as unit',
    ])
    .whereIn('p.PLANKEY', planKeyQuery)
    .andWhereNot('REQNO_BATCH', null)
    .orderBy([
      { column: 'p.RCPINDEX' },
      { column: 'DYEREQUESTNUMBER' },
      { column: 'PARALLELSTEP' },
    ])

  const manualRecipe = knex('DYBFBATCHORDERRECIPEMANUALS as r')
    .leftJoin('DYBFBATCHORDERRECIPEHEADER as p', (builder) => {
      builder.on('r.PLANKEY', '=', 'p.PLANKEY')
        .andOn('r.RCPINDEX', '=', 'p.RCPINDEX')
    })
    .leftJoin('BFMASTERPRGHEADER as h', (builder) => {
      builder.on('p.RECIPENO', '=', 'h.PROGNO')
        .andOn('h.MACHINEID', '=', knex.raw(recipeID))
    })
    .leftJoin('DYTFMATERIAL as m', (builder) => {
      builder.on('m.MATERIALCODE', '=', 'r.CHEMCODE')
    })
    .select([
      'p.RCPINDEX as recIndex',
      'p.RECIPENO as recNo',
      'h.NAME as name',
      'DYEREQUESTNUMBER as reqNumber',
      'MAINSTEP as mainStep',
      'PARALLELSTEP as parallelStep',
      'r.RECIPETYPE as recType',
      'CHEMCODE as chemCode',
      'm.MATERIALNAME as materialName',
      'AMOUNT as amount',
      'REQNO_BATCH as reqBatchNo',
      'REQNO_PROG as reqProgNo',
      knex.raw('NULL as phaseNo'),
      knex.raw('NULL as phaseIndex'),
      'otherUnit as unit',
    ])
    .whereIn('p.PLANKEY', planKeyQuery)
    .andWhereNot('AMOUNT', 0)
    .andWhereNot('REQNO_BATCH', 'is not', null)
    .orderBy([
      { column: 'p.RCPINDEX' },
      { column: 'DYEREQUESTNUMBER' },
      { column: 'PARALLELSTEP' },
    ])

  const [auto, manual] = await Promise.all([autoRecipe, manualRecipe])
  return [...auto, ...manual]
}

export async function getDyeingRecipe(recipeJB: string, recipeID: number): Promise<Recipe[]> {
  const planKeyQuery = getLatestPlanKey(recipeJB)

  const autoRecipe = knex('DYBFBATCHORDERRECIPESTEPS as r')
    .rightJoin('DYBFBATCHORDERRECIPEHEADER as p', (builder) => {
      builder.on('r.PLANKEY', 'p.PLANKEY')
        .andOn('r.RCPINDEX', 'p.RCPINDEX')
    }).leftJoin('BFMASTERPRGHEADER as h', (builder) => {
      builder.on('p.RECIPENO', 'h.PROGNO')
        .andOn('h.MACHINEID', knex.raw(recipeID))
    })
    .leftJoin('DYTFMATERIAL as m', (builder) => {
      builder.on('m.MATERIALCODE', 'r.CHEMCODE')
    }).select([
      'p.RCPINDEX as recIndex',
      'p.RECIPENO as recNo',
      'h.NAME as name',
      'DYEREQUESTNUMBER as reqNumber',
      'MAINSTEP as mainStep',
      'PARALLELSTEP as parallelStep',
      'r.RECIPETYPE as recType',
      'CHEMCODE as chemCode',
      'm.MATERIALNAME as materialName',
      'AMOUNT as amount',
      'REQNO_BATCH as reqBatchNo',
      'REQNO_PROG as reqProgNo',
      'otherUnit as unit',
    ])
    .whereNot('REQNO_BATCH', null)
    .whereIn('p.PLANKEY', planKeyQuery)
    .orderBy([
      { column: 'p.RCPINDEX' },
      { column: 'DYEREQUESTNUMBER' },
      { column: 'PARALLELSTEP' },
    ])

  const manualRecipe = knex('DYBFBATCHORDERRECIPEMANUALS AS r')
    .leftJoin(
      'DYBFBATCHORDERRECIPEHEADER AS p',
      (builder) => {
        builder.on('r.PLANKEY', 'p.PLANKEY').andOn('r.RCPINDEX', 'p.RCPINDEX')
      },
    )
    .leftJoin(
      'BFMASTERPRGHEADER AS h',
      (builder) => {
        builder.on('p.RECIPENO', 'h.PROGNO').andOn('h.MACHINEID', knex.raw(recipeID))
      },
    )
    .leftJoin('DYTFMATERIAL AS m', 'm.MATERIALCODE', 'r.CHEMCODE')
    .select(
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
      'otherUnit AS unit',
    )
    .whereIn('p.PLANKEY', planKeyQuery)
    .andWhereNot('REQNO_BATCH', null)
    .andWhereNot('AMOUNT', 0)
    .orderBy([
      { column: 'p.RCPINDEX' },
      { column: 'DYEREQUESTNUMBER' },
      { column: 'PARALLELSTEP' },
    ])

  const [auto, manual] = await Promise.all([autoRecipe, manualRecipe])
  return [...auto, ...manual]
}
