import { addMinutes, subMinutes } from 'date-fns'
import { isDef } from '@teleskop/utils'
import { db } from '../database'
import { isBatchActive } from './io'
import type { BatchAlarm, BatchCommand, BatchIntervention, MergedBatchCommand } from '~/types/archive'
import type { DuoParsed } from '~/types/utils'

export async function getAlarms(batchKey: number, since?: Date | null): Promise<DuoParsed<BatchAlarm>[]> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()

  const query = db
    .from('BAALARM')
    .select({
      batchAlarmNo: 'BATCHALARMNO',
      alarmNo: 'ALARMNO',
      programNo: 'PROGNO',
      commandNo: 'COMMANDNO',
      startTime: db.raw(`DATEADD(MINUTE, ?, STARTTIME)`, teleskopTimezoneOffset),
      endTime: db.raw(`DATEADD(MINUTE, ?, ENDTIME)`, teleskopTimezoneOffset),
      explanation: 'EXPLANATION',
      alarmType: 'ALARMTYPE',
      isParallel: 'ISPARALLEL',
    })
    .where('BATCHKEY', batchKey)
    .orderBy('STARTTIME')

  if (since) {
    query.andWhere('STARTTIME', '>', subMinutes(since, teleskopTimezoneOffset))
  }

  return await query as DuoParsed<BatchAlarm>[]
}

/**
 * Makine müdahalelerini, müdahale zamanına göre artan sıralamada döndürür.
 * `since` parametresi verilirse, `since` tarihinden itibaren gerçekleşen müdahalelerini verir.
 */
export async function getInterventions(batchKey: number, since?: Date | null): Promise<BatchIntervention[]> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()

  const query = db
    .from('BAINTERVENTION as BI')
    .select({
      eventId: 'BI.EVENTID',
      time: db.raw(`DATEADD(MINUTE, ?, BI.INTERVENTTIME)`, teleskopTimezoneOffset),
      parameters: db.raw(/* sql */`'['
      + '"' + BI.P1 + '",'
      + '"' + BI.P2 + '",'
      + '"' + BI.P3 + '"]'
    `),
      explanation: 'BI.EXPLANATION',
      operator: db.raw(`UA.USERNAME + ' ' + UA.USERLASTNAME`),
    })
    .where('BI.BATCHKEY', batchKey)
    .orderBy('BI.INTERVENTTIME')
    .joinRaw(`
    OUTER APPLY (
      SELECT TOP 1 *
      FROM BAUSERACTIVITY UA
      WHERE UA.MACHINEID = BI.MACHINEID
      AND UA.ACTIVITYDATE <= BI.INTERVENTTIME
      ORDER BY UA.ACTIVITYDATE DESC
    ) UA
  `)

  if (since) {
    query.andWhere('INTERVENTTIME', '>', subMinutes(since, teleskopTimezoneOffset))
  }

  const interventions = await query
  for (const int of interventions) {
    int.parameters = JSON.parse(int.parameters).filter(Boolean)
    int.explanation = int.explanation.split(/ ?,?\r ?/)
  }

  return interventions
}

/**
 * Makinede çalışan komutları, adım sırasına göre artan sırada verir.
 * `since` parametresi verilirse, `since` tarihinden itibaren çalışmaya başlayan komutları verir.
 */
export async function getActualCommands(batchKey: number, since?: Date | null): Promise<DuoParsed<BatchCommand>[]> {
  const { teleskopTimezoneOffset } = useRuntimeConfig()
  const query = db
    .from('BAACTUALPRGSTEPS as S')
    .select({
      programNo: 'S.PRGNO',
      programName: 'PH.NAME',
      stepNo: 'S.STEPNO',
      parallelStepNo: 'S.PARALLELSTEPNO',
      commandNo: 'S.COMMANDNO',
      startTime: db.raw(`DATEADD(MINUTE, ?, S.STARTTIME)`, teleskopTimezoneOffset),
      endTime: db.raw(`DATEADD(MINUTE, ?, S.ENDTIME)`, teleskopTimezoneOffset),
    })
    .join('BADATA as B', function () {
      this.on('S.BATCHKEY', '=', 'B.BATCHKEY')
    })
    .join('BAMASTERPRGHEADER as PH', function () {
      this.on('S.PRGNO', '=', 'PH.PROGNO')
        .andOn('B.MACHINEID', '=', 'PH.MACHINEID')
    })
    .where('S.BATCHKEY', batchKey)
    .andWhere('S.STARTTIME', '>=', db.raw('PH.RELEASEDATE'))
    .andWhere((b) => {
      b.whereNull('PH.RELEASEENDDATE')
        .orWhere('S.STARTTIME', '<', db.raw('PH.RELEASEENDDATE'))
    })
    .orderBy('S.STEPNO', 'asc')

  if (since) {
    query.andWhere('STARTTIME', '>', subMinutes(since, teleskopTimezoneOffset))
  }

  return await query as DuoParsed<BatchCommand>[]
}

export async function getMergedCommands(batchKey: number, isActive?: boolean | null): Promise<MergedBatchCommand[]> {
  const config = useRuntimeConfig()

  if (!isDef(isActive)) {
    isActive = await isBatchActive(batchKey)
    if (!isDef(isActive)) {
      throw createError({
        statusCode: 404,
        message: 'BATCH_NOT_FOUND',
      })
    }
  }

  const result = await db.raw(`
    DECLARE @Result INT;

    EXEC spGetTheoricCommandNumbers
        @BatchKey = ?,
        @IsArchiveData = ?,
        @Result = @Result OUTPUT;

  `, [batchKey, !isActive])

  return result.map((step: any) => {
    return {
      theoreticalStepNo: step.THEORICSTEPNO,
      actualStepNo: step.ACTUALSTEPNO,
      programNo: step.PRGNO,
      commandNo: step.COMMANDNO,
      startTime: step.STARTTIME ? addMinutes(step.STARTTIME, config.teleskopTimezoneOffset) : null,
      endTime: step.ENDTIME ? addMinutes(step.ENDTIME, config.teleskopTimezoneOffset) : null,
      theoreticalDuration: step.THEORETICDURATION,
      stepStatus: step.STEPSTATUS,
      isFinished: step.ISWORKED,
    }
  })
}
