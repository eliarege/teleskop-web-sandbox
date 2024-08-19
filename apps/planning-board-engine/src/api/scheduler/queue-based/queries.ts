import type { QueueBasedActualEvent, QueueBasedNonActualEvent } from '../../../../types/planning-board'
import { queueBasedEventStatus } from '../../../composables/helper'
import { knex } from '../../../knexConfig'
import { planningBoardStops } from '../queries'
import { config } from '~/config'

export interface EventReschedule {
  planKey: number
  machineId: number
  queueNumber: number
}
// GET
export async function getQueueBasedEvents(startDate: string, endDate: string, includeStops: boolean) {
  const plannedEvents = await getQueueBasedPlannedEvents(startDate, endDate)
  const actualEvents = await getQueueBasedActualEvents(startDate, endDate)

  if (includeStops) {
    const stops = await planningBoardStops(startDate, endDate)
    return await queueBasedEventStatus([...plannedEvents, ...actualEvents, ...stops], includeStops)
  } else return await queueBasedEventStatus([...plannedEvents, ...actualEvents], includeStops)
}
export async function getFullQueueBasedEvents() {
  const plannedEvents = await knex.raw(/* sql */`
  select jobOrder, startTime from (
        select
              d.JOBORDER AS jobOrder,
                CASE
                      WHEN p.QUEUENUMBER = 1 THEN GETUTCDATE()
                      ELSE DATEADD(second, COALESCE(
                            SUM(CASE
                              WHEN d.TheoricalDuration = 0 OR d.TheoricalDuration IS NULL THEN 28800
                              ELSE d.TheoricalDuration
                            END + 300) OVER (PARTITION BY d.PLANNEDMACHINE ORDER BY p.QUEUENUMBER ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0), GETUTCDATE())
                    END AS startTime
        from DYBFBATCHPLAN d
        LEFT JOIN PTBATCHPLANQUEUE p ON p.PLANKEY = d.PLANKEY
        LEFT JOIN DYBFBATCHPLANPARAMETERS c ON c.PLANKEY = d.PLANKEY AND c.PARAMSTRING = 'Kilo'
        WHERE d.ISDELETED IS NULL OR d.ISDELETED = 0
        AND p.PLANKEY IS NOT NULL
) as subQuery
  `)
  const actualEvents = await knex.raw(/* sql */`
    WITH ActualEvent AS (
        SELECT
          DATEADD(MINUTE, :timezoneOffset, startTime) as startTime,
          jobOrder
        FROM (
          select
              b.STARTTIME as startTime,
              b.JOBORDER as jobOrder,
              ROW_NUMBER() OVER (PARTITION BY b.PLANKEY ORDER BY b.BATCHREFERENCE DESC) AS rowNumber
          from BADATA b
          left join DYBFBATCHPLAN d ON d.PLANKEY = b.PLANKEY
        ) as subquery
        WHERE rowNumber = 1
      )
      SELECT * FROM ActualEvent
    `, { timezoneOffset: config.teleskopTimezoneOffset })
  return [...plannedEvents, ...actualEvents]
}
export async function getQueueBasedPlannedEvents(startDate: string, endDate: string): Promise<QueueBasedNonActualEvent[]> {
  const events = await knex.raw(/* sql */`
      select DATEADD(second, theoreticalDuration, startTime) AS endTime,* from (
        select
            'planned' as eventType,
            d.PLANKEY AS planKey,
              d.RECORDTIME AS recordTime,
              d.JOBORDER AS jobOrder,
              c.VALUE AS fabricWeight,
              d.PLANNEDMACHINE AS machineId,
              d.PRGCOUNT AS programCount,
              d.PROGRAMNOLIST AS programList,
                CASE
                      WHEN p.QUEUENUMBER = 1 THEN GETUTCDATE()
                      ELSE DATEADD(second, COALESCE(
                            SUM(CASE
                              WHEN d.TheoricalDuration = 0 OR d.TheoricalDuration IS NULL THEN 28800
                              ELSE d.TheoricalDuration
                            END + 300) OVER (PARTITION BY d.PLANNEDMACHINE ORDER BY p.QUEUENUMBER ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0), GETUTCDATE())
                    END AS startTime,
              d.NOTE AS note,
              CASE
                WHEN d.TheoricalDuration IS NULL THEN 28800
                WHEN d.TheoricalDuration = 0 THEN 28800
                ELSE d.TheoricalDuration
              END AS theoreticalDuration,
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
        from DYBFBATCHPLAN d
        LEFT JOIN PTBATCHPLANQUEUE p ON p.PLANKEY = d.PLANKEY
        LEFT JOIN DYBFBATCHPLANPARAMETERS c ON c.PLANKEY = d.PLANKEY AND c.PARAMSTRING = 'Kilo'
        WHERE d.ISDELETED IS NULL OR d.ISDELETED = 0
        AND p.PLANKEY IS NOT NULL
      ) as subQuery
      where startTime between ? and ?
      ORDER BY machineId, queueNumber
  `, [startDate, endDate])

  return events.map(ev => ({
    ...ev,
    theoreticalDuration: ev.theoreticalDuration === 0 ? 28800 : ev.theoreticalDuration,
    erpParameters: ev.erpParameters ? Object.fromEntries(JSON.parse(ev.erpParameters).map(a => [a.paramName, a.value])) : [],
  }))
}

export async function getQueueBasedActualEvents(startTime: string, endTime: string): Promise<QueueBasedActualEvent[]> {
  return await knex.raw(/* sql */`
      WITH ActualEvent AS (
        SELECT
          CASE
            WHEN planKey IS NULL THEN 'manual'
            WHEN endTime IS NULL AND cancelTime IS NULL then 'ongoing'
            WHEN endTime IS NOT NULL OR cancelTime IS NOT NULL then 'finished'
          END as eventType,
          DATEADD(MINUTE, :timezoneOffset, startTime) as startTime,
          DATEADD(MINUTE, :timezoneOffset, COALESCE(endTime, cancelTime,
            IIF(
              DATEADD(SECOND, theoreticalDuration, startTime) > DATEADD(MINUTE, -1 * :timezoneOffset, GETUTCDATE()),
              DATEADD(SECOND, theoreticalDuration, startTime),
              DATEADD(MINUTE, -1 * :timezoneOffset, GETUTCDATE())
            )
          )) as endTime,
          machineId,
          note,
          planKey,
          jobOrder,
          programNoList,
          theoreticalDuration,
          fabricWeight,
          fabricColor,
          isDeleted,
          isStarted,
          isStopped,
          batchKey,
          deviation
        FROM (
          select
              b.MACHINEID as machineId,
              b.STARTTIME as startTime,
              b.CANCELTIME as cancelTime,
              b.ENDTIME as endTime,
              d.NOTE as note,
              b.PLANKEY as planKey,
              b.JOBORDER as jobOrder,
              b.PROGRAMNOLIST as programNoList,
              b.THEORETICDURAT AS theoreticalDuration,
              b.FABRIC_WEIGHT AS fabricWeight,
              d.Color as fabricColor,
              d.ISDELETED as isDeleted,
              d.ISSTARTED as isStarted,
              d.ISSTOPPED as isStopped,
              b.BATCHKEY as batchKey,
              b.DEVIATION as deviation,
              ROW_NUMBER() OVER (PARTITION BY b.PLANKEY ORDER BY b.BATCHREFERENCE DESC) AS rowNumber
          from BADATA b
          left join DYBFBATCHPLAN d ON d.PLANKEY = b.PLANKEY
        ) as subquery
        WHERE rowNumber = 1
      )
      SELECT * FROM ActualEvent
      WHERE (startTime BETWEEN :startTime AND :endTime)
      OR  (endTime BETWEEN :startTime AND :endTime)
      OR  (startTime < :startTime AND :endTime < endTime)
      `, { timezoneOffset: config.teleskopTimezoneOffset, startTime, endTime })
}

export async function checkMachineLastTaskQueue(machineId: number) {
  return await knex({ p: 'PTBATCHPLANQUEUE' })
    .select({
      queueNumber: 'p.QUEUENUMBER',
    })
    .where('p.MACHINEID', '=', machineId)
    .orderBy('p.QUEUENUMBER', 'desc')
    .limit(1)
}

export async function updateEventQueue(previousEventData: EventReschedule, newEventData: EventReschedule) {
  await knex.transaction(async (trx) => {
    await trx('PTBATCHPLANQUEUE')
      .where('PLANKEY', previousEventData.planKey)
      .update({
        QUEUENUMBER: 0,
      })

    if (newEventData.machineId !== previousEventData.machineId) {
      await trx('PTBATCHPLANQUEUE')
        .where('MACHINEID', newEventData.machineId)
        .andWhere('QUEUENUMBER', '>=', newEventData.queueNumber)
        .update({
          QUEUENUMBER: trx.raw('?? + 1', ['QUEUENUMBER']),
        })

      await trx('PTBATCHPLANQUEUE')
        .where('MACHINEID', previousEventData.machineId)
        .andWhere('QUEUENUMBER', '>=', previousEventData.queueNumber)
        .update({
          QUEUENUMBER: trx.raw('?? - 1', ['QUEUENUMBER']),
        })
    } else {
      if (previousEventData.queueNumber > newEventData.queueNumber) {
        await trx('PTBATCHPLANQUEUE')
          .where('MACHINEID', previousEventData.machineId)
          .andWhere('QUEUENUMBER', '>=', newEventData.queueNumber)
          .andWhere('QUEUENUMBER', '<', previousEventData.queueNumber)
          .update({
            QUEUENUMBER: trx.raw('?? + 1', ['QUEUENUMBER']),
          })
      } else {
        await trx('PTBATCHPLANQUEUE')
          .where('MACHINEID', previousEventData.machineId)
          .andWhere('QUEUENUMBER', '>', previousEventData.queueNumber)
          .andWhere('QUEUENUMBER', '<=', newEventData.queueNumber)
          .update({
            QUEUENUMBER: trx.raw('?? - 1 ', ['QUEUENUMBER']),
          })
      }
    }

    await trx('PTBATCHPLANQUEUE')
      .where('PLANKEY', previousEventData.planKey)
      .update({
        MACHINEID: newEventData.machineId,
        QUEUENUMBER: newEventData.queueNumber,
      })

    await trx('DYBFBATCHPLAN')
      .where('PLANKEY', previousEventData.planKey)
      .update({
        MACHINEIDLIST: newEventData.machineId,
        PLANNEDMACHINE: newEventData.machineId,
      })
  })
}
export async function queueUnplannedEvents(newData: EventReschedule) {
  await knex.transaction(async (trx) => {
    await trx('PTBATCHPLANQUEUE')
      .where('MACHINEID', newData.machineId)
      .andWhere('QUEUENUMBER', '>=', newData.queueNumber)
      .update({
        QUEUENUMBER: trx.raw('?? + 1', ['QUEUENUMBER']),
      })
    await trx('DYBFBATCHPLAN')
      .where('PLANKEY', newData.planKey)
      .update({
        MACHINEIDLIST: newData.machineId,
        PLANNEDMACHINE: newData.machineId,
      })
    await trx('PTBATCHPLANQUEUE').insert({
      PLANKEY: newData.planKey,
      MACHINEID: newData.machineId,
      QUEUENUMBER: newData.queueNumber,
      PINNED: 0,
      STARTTIME: null,
      STATE: null,
    })
  })
}
