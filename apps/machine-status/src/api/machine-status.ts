import type { FastifyPluginAsync } from 'fastify'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'
import pMemoize from 'p-memoize'
import { LRUCache } from 'lru-cache'
import { config } from '../config'
import type { TeleskopDatabase } from '../types'

interface MachineStatus {
  id: number
  runningJobOrder: string | null
  runningBatchKey: number | null
  runningFabricWeight: string | number | null
  runningPlankey: number | null
  erp: Record<string, unknown> | null
  [key: string]: any
}
const erpParameterCache = new LRUCache<string, Record<string, any>>({
  max: 1000,
})
const machineStatusCache = new LRUCache<string, MachineStatus[]>({
  ttl: config.machineStatusMaxAge,
  ttlAutopurge: false,
})
const fetchMachineStatus = pMemoize(async (teleskop: Kysely<TeleskopDatabase>): Promise<MachineStatus[]> => {
  return await teleskop
    .selectFrom('BFMACHINES as m')
    .leftJoin('TFMACHINESTATUS as s', 'm.MACHINEID', 's.MACHINEID')
    .leftJoin('BFMACHGROUP as g', 'm.GRUPNO', 'g.GROUPID')
    .leftJoin('BADATA as b', 'b.BATCHKEY', 's.RUNNING_BATCHKEY')
    .leftJoin('BFSTOPREASONS as t', 't.STOPNAME', 's.stopReason')
    .leftJoin('DYBFBATCHPLAN as d', join => join
      .onRef('d.JOBORDER', '=', 's.RUNNING_JOBORDER')
      .on('d.lastForJobOrder', '=', 1))
    .leftJoin(eb => eb
      .selectFrom('BACONSUMPTIONPROGRAM as c')
      .groupBy('c.MACHINEID')
      .select(({ fn }) => [
        'c.MACHINEID as machineId',
        fn.agg<number>('sum', ['c.WaterTotal']).as('totalConsumedWater'),
        fn.agg<number>('sum', ['c.SALT']).as('totalConsumedSalt'),
        fn.agg<number>('sum', ['c.STEAM']).as('totalConsumedSteam'),
        fn.agg<number>('sum', ['c.FM1VALUE']).as('totalFM1'),
        fn.agg<number>('sum', ['c.ELECTRICITY']).as('totalConsumedElectricity'),
      ]).as('totals'), join => join
      .onRef('m.MACHINEID', '=', 'totals.machineId'))
    .select([
      'm.MACHINEID as id',
      'm.MACHINECODE as name',
      'm.MACHINECAPACITY as machineCapacity',
      'm.IP as machineIpAddress',
      'g.GROUPNAME as groupName',
      sql<number>`coalesce(datediff(second, DATEADD(MINUTE, ${config.teleskopTimezoneOffset}, s.RUNNING_JOBORDERSTARTTIME), GETUTCDATE()), 0)`.as('elapsedTime'),
      's.RUNNING_THEOTIME as theoreticalDuration',
      's.RUNNING_AUTOMANSTATUS as autoManualStatus',
      's.RUNNING_OPRNO as loggedInOperatorNo',
      's.RUNNING_OPRNAME as loggedInOperatorName',
      'd.PLANKEY as runningPlankey',
      's.RUNNING_JOBORDER as runningJobOrder',
      sql<string>`DATEADD(MINUTE, ${config.teleskopTimezoneOffset}, s.RUNNING_JOBORDERSTARTTIME)`.as('runningStartTime'),
      's.RUNNING_BATCHKEY as runningBatchKey',
      's.RUNNING_BATCHSTATUS as runningBatchStatus',
      's.RUNNING_PROGRAMID as runningProgramId',
      's.RUNNING_PROGRAMNAME as runningProgramName',
      's.RUNNING_PROGNOLIST as runningProgramList',
      's.RUNNING_STEPNO as runningStepNo',
      's.RUNNING_CMDNO as runningCommandNo',
      's.RUNNING_CMDNAME as runningCommandName',
      's.RUNNING_ALARMNO as runningAlarmNo',
      's.RUNNING_ALARMNAME as runningAlarmName',
      's.RUNNING_THEOTIME as runningTheoreticalDuration',
      's.RUNNING_PHASENO as runningPhaseNo',
      's.RUNNING_PHASENAME as runningPhaseName',
      's.RUNNING_PHASESTEPNO as runningPhaseStepNo',
      'b.FABRIC_WEIGHT as runningMachineCapacity',
      's.REQ_RECIPEINDEX as reqRecipeIndex',
      's.REQ_REQORDERINDEX as reqOrderIndex',
      's.REQ_OPERATIONCODE as reqOperationCode',
      's.REQ_TARGETRECIPE as reqTargetRecipe',
      's.REQ_TANKNO as reqTankNo',
      's.REQ_PRIORITY as reqPriority',
      's.REQ_TOTALREQCOUNT as totalRequestCount',
      's.REQ_PRGNO as reqProgramNo',
      's.REQ_CMDNO as reqCommandNo',
      's.REQ_STATUS as reqStatus',
      's.stopReason',
      't.ReportToERP as machineError',
      sql<string>`DATEADD(MINUTE, ${config.teleskopTimezoneOffset}, s.stopReasonDateTime)`.as('stopReasonDateTime'),
      's.ConnectionStatus as connectionStatus',
      's.IsSynchronizing as isSynchronizing',
      's.currentTemp as currentTemperature',
      's.currentAlarmStatus',
      's.runningCompletionRatio',
      's.manuelReason as manualReason',
      sql<string>`DATEADD(MINUTE, ${config.teleskopTimezoneOffset}, s.manuelReasonDateTime)`.as('manualReasonDateTime'),
      's.MANUELCOMMANDACTIVE as manualCommandActive',
      'totals.totalConsumedWater',
      'totals.totalConsumedSalt',
      'totals.totalConsumedSteam',
      'totals.totalFM1',
      'totals.totalConsumedElectricity',
      sql<Record<string, any> | null>`null`.as('erp'),
      sql<number>`
        (SELECT
          COALESCE(TRY_CAST(ERPVALUE as float),0)
        FROM DYBFBATCHPLANERPPARAMETERS
        WHERE ERPFIELDNAME = 'Weight'
        AND PLANKEY = b.PLANKEY)`.as('runningFabricWeight'),
      sql<number>`
        (SELECT TOP 1
            DATEDIFF(SECOND, b.STARTTIME, GETDATE())
         FROM BAACTUALPRGSTEPS b
         WHERE b.BATCHKEY = s.RUNNING_BATCHKEY
           AND b.PRGINDEX = -1
           AND b.PARALLELSTEPNO = 0
           AND b.PRGNO = s.RUNNING_PROGRAMID
         ORDER BY b.STARTTIME ASC)`.as('runningPrgElapsedTime'),
      sql<number>`
        (SELECT SUM(b1.THEORETICDURATION)
         FROM BAACTUALPRGSTEPS b1
         WHERE b1.BATCHKEY = s.RUNNING_BATCHKEY
           AND b1.PRGINDEX = -1
           AND b1.PARALLELSTEPNO = 0
           AND b1.PRGNO = s.RUNNING_PROGRAMID)`.as('runningPrgTotalTheoreticDuration'),
    ])
    .where(eb => eb.and([
      eb('m.INUSE', '=', true),
      eb('m.USEINTELESKOP', '=', true),
    ]))
    .execute()
}, {
  cacheKey: () => 'machineStatus',
  cache: machineStatusCache,
})

const fetchJobOrderErpParameters = pMemoize(async (
  teleskop: Kysely<TeleskopDatabase>,
  jobOrder: string,
  _batchKey: number,
): Promise<Record<string, any>> => {
  const planKeyResult = await teleskop
    .selectFrom('DYBFBATCHPLAN as d')
    .select('d.PLANKEY as planKey')
    .where('d.JOBORDER', '=', jobOrder)
    .where('d.lastForJobOrder', '=', 1)
    .executeTakeFirst()

  const planKey = planKeyResult?.planKey
  if (!planKey)
    return {}

  const erpRows = await teleskop
    .selectFrom('DYBFBATCHPLANPARAMETERS as d')
    .select(['d.PARAMSTRING as key', 'd.VALUE as value'])
    .where('d.PLANKEY', '=', planKey)
    .execute()

  const erp: Record<string, any> = {}
  for (const row of erpRows) {
    erp[row.key] = row.value
  }
  return erp
}, {
  cacheKey: ([_, _jobOrder, batchKey]) => batchKey.toString(),
  cache: erpParameterCache,
})

const route: FastifyPluginAsync = async (fastify) => {
  const aliases = ['/', '/api/v1/machine_status']

  aliases.forEach(alias =>
    fastify.get(alias, async function () {
      const { teleskop } = this
      const machineStatuses = await fetchMachineStatus(teleskop)
      for (const status of machineStatuses) {
        if (status.runningJobOrder && status.runningBatchKey && status.runningBatchKey > 0) {
          status.erp = await fetchJobOrderErpParameters(teleskop, status.runningJobOrder, status.runningBatchKey)
        }
      }
      return machineStatuses
    }),
  )
}

export default route
