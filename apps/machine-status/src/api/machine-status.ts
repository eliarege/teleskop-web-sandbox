import type { FastifyPluginAsync } from 'fastify'
import { jsonArrayFrom } from 'kysely/helpers/mssql'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'
import { config } from '../config'
import type { DmExchangeDatabase, TeleskopDatabase } from '../types'
import { memoize } from '../utils'

interface MachineErpMappings {
  machineId: number
  mappings: {
    name: string
    field: string
  }[]
}

interface MachineStatus {
  id: number
  runningJobOrder: string | null
  runningBatchKey: number | null
  runningFabricWeight: string | number | null
  erp: Record<string, unknown> | null
  [key: string]: any
}

const fetchMachineErpMappings = memoize(async (teleskop: Kysely<TeleskopDatabase>, isLegacy: boolean): Promise<MachineErpMappings[]> => {
  return await teleskop
    .selectFrom('BFMACHINES as m')
    .select(eb => [
      'm.MACHINEID as machineId',
      jsonArrayFrom(
        eb
          .selectFrom('BFERPPARAMETERDEFINITIONS as d')
          .select([
            'd.PARAMNAME as name',
            'd.ERPFIELDNAME as field',
          ])
          .where(eb => eb.and([
            eb('d.ERPFIELDNAME', 'is not', null),
            eb('d.ERPFIELDNAME', '!=', ''),
            ...(!isLegacy
              ? [eb('m.MACHINEID', '=', eb.ref('d.MACHINEID'))]
              : []),
          ])),
      ).as('mappings'),
    ])
    .where(eb => eb.and([
      eb('m.INUSE', '=', true),
      eb('m.USEINTELESKOP', '=', true),
    ]))
    .execute() as MachineErpMappings[]
}, {
  maxAge: config.machineErpMappingsMaxAge,
})

const fetchMachineStatus = memoize(async (teleskop: Kysely<TeleskopDatabase>): Promise<MachineStatus[]> => {
  return await teleskop
    .selectFrom('BFMACHINES as m')
    .leftJoin('TFMACHINESTATUS as s', 'm.MACHINEID', 's.MACHINEID')
    .leftJoin('BFMACHGROUP as g', 'm.GRUPNO', 'g.GROUPID')
    .leftJoin('BADATA as b', 'b.BATCHKEY', 's.RUNNING_BATCHKEY')
    .leftJoin('BFSTOPREASONS as t', 't.STOPNAME', 's.stopReason')
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
      sql<number>`coalesce(datediff(second, s.RUNNING_JOBORDERSTARTTIME, getdate()), 0)`.as('elapsedTime'),
      's.RUNNING_THEOTIME as theoreticalDuration',
      's.RUNNING_AUTOMANSTATUS as autoManualStatus',
      's.RUNNING_OPRNO as loggedInOperatorNo',
      's.RUNNING_OPRNAME as loggedInOperatorName',
      's.RUNNING_JOBORDER as runningJobOrder',
      's.RUNNING_JOBORDERSTARTTIME as runningStartTime',
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
      's.stopReasonDateTime',
      's.ConnectionStatus as connectionStatus',
      's.IsSynchronizing as isSynchronizing',
      's.currentTemp as currentTemperature',
      's.currentAlarmStatus',
      's.runningCompletionRatio',
      's.manuelReason as manualReason',
      's.manuelReasonDateTime as manualReasonDateTime',
      's.MANUELCOMMANDACTIVE as manualCommandActive',
      'totals.totalConsumedWater',
      'totals.totalConsumedSalt',
      'totals.totalConsumedSteam',
      'totals.totalFM1',
      'totals.totalConsumedElectricity',
      sql<Record<string, any> | null>`null`.as('erp'),
      sql<number>`
        (SELECT
          CAST(ERPVALUE as float)
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
  maxAge: config.machineStatusMaxAge,
})

const fetchJobOrderErpParameters = memoize(async (
  dmExchange: Kysely<DmExchangeDatabase>,
  jobOrder: string,
  machineMappings: MachineErpMappings,
): Promise<Record<string, any>> => {
  if (!machineMappings.mappings.length)
    return {}
  return await dmExchange
    .selectFrom('Dyelots')
    .select(eb =>
      machineMappings.mappings
        .filter(m => m.field)
        .map(m => eb.ref(m.field as any).as(m.name)),
    )
    .where('Dyelot', '=', jobOrder)
    .executeTakeFirst() || {}
}, {
  cacheKey: (_, jobOrder) => jobOrder,
  maxAge: config.jobOrderErpParametersMaxAge,
})

/**
 * `BFERPPARAMETERDEFINITIONS` tablosunda `MACHINEID` sütunu yoksa, veri tabanının legacy (eski) olduğu varsayılır.
 * Bu özelliğe göre bazı sorgular değişiklik gösterir.
 */
async function isLegacyTeleskop(teleskop: Kysely<TeleskopDatabase>): Promise<boolean> {
  const tables = await teleskop.introspection.getTables()
  const erpParameterDefinitionsMeta = tables
    .find(t => t.schema === 'dbo' && t.name === 'BFERPPARAMETERDEFINITIONS')
  if (erpParameterDefinitionsMeta) {
    const isLegacy = !erpParameterDefinitionsMeta.columns.some(col => col.name === 'MACHINEID')
    return isLegacy
  } else {
    throw new Error(`Missing BFERPPARAMETERDEFINITIONS table`)
  }
}

const route: FastifyPluginAsync = async (fastify) => {
  const isLegacy = await isLegacyTeleskop(fastify.teleskop)
  const aliases = ['/', '/api/v1/machine_status']

  aliases.forEach(alias =>
    fastify.get(alias, async function () {
      const { teleskop, dmExchange } = this
      const machineStatuses = await fetchMachineStatus(teleskop)
      const machineMappings = await fetchMachineErpMappings(teleskop, isLegacy)

      if (dmExchange) {
        for (const status of machineStatuses) {
          const mappings = machineMappings.find(m => m.machineId === status.id)
          if (mappings && status.runningJobOrder && status.runningBatchKey && status.runningBatchKey > 0) {
            status.erp = await fetchJobOrderErpParameters(dmExchange, status.runningJobOrder, mappings)
          }
        }
      }

      return machineStatuses
    }),
  )
}

export default route
