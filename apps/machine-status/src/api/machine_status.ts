import type { FastifyPluginAsync } from 'fastify'
import { jsonArrayFrom } from 'kysely/helpers/mssql'
import { sql } from 'kysely'
import { dmExchange, teleskop } from '../database'
import { config } from '../config'

interface MachineErpMappings {
  machineId: number
  mappings: {
    name: string
    field: string
  }[]
}

async function fetchMachineErpMappings(isLegacy: boolean): Promise<MachineErpMappings[]> {
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
}

async function fetchMachineStatus() {
  return await teleskop
    .selectFrom('BFMACHINES as m')
    .leftJoin('TFMACHINESTATUS as s', 'm.MACHINEID', 's.MACHINEID')
    .leftJoin('BFMACHGROUP as g', 'm.GRUPNO', 'g.GROUPID')
    .leftJoin('BADATA as b', 'b.BATCHKEY', 's.RUNNING_BATCHKEY')
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
      sql<number>`datediff(second, b.STARTTIME, getdate())`.as('elapsedTime'),
      'b.THEORETICDURAT as theoreticalDuration',
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
    ])
    .where(eb => eb.and([
      eb('m.INUSE', '=', true),
      eb('m.USEINTELESKOP', '=', true),
    ]))
    .execute()
}

async function fetchJobOrderErpParameters(jobOrder: string, machineMappings: MachineErpMappings): Promise<Record<string, any>> {
  return await dmExchange
    .selectFrom('Dyelots')
    .select(eb => machineMappings.mappings.map(m => eb.ref(m.field as any).as(m.name)))
    .where('Dyelot', '=', jobOrder)
    .executeTakeFirst() || {}
}

const route: FastifyPluginAsync = async (fastify) => {
  fastify.get('/machine_status', async () => {
    const machineStatuses = await fetchMachineStatus()
    const machineMappings = await fetchMachineErpMappings(false)

    if (config.dmExchangeUrl) {
      for (const status of machineStatuses) {
        const mappings = machineMappings.find(m => m.machineId === status.id)
        if (mappings && status.runningJobOrder && status.runningBatchKey && status.runningBatchKey > 0) {
          status.erp = await fetchJobOrderErpParameters(status.runningJobOrder, mappings)
        }
      }
    }

    return machineStatuses
  })
}

export default route
