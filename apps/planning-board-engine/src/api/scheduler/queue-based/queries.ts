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
    return await queueBasedEventStatus([...plannedEvents, ...actualEvents, ...stops])
  } else return await queueBasedEventStatus([...plannedEvents, ...actualEvents])
}

export async function getQueueBasedPlannedEvents(startDate: string, endDate: string): Promise<QueueBasedNonActualEvent[]> {
  const events = await knex.raw(`
  With nonActualEvents as (
    SELECT
      CASE
        WHEN queueNumber IS NULL THEN 'unplanned'
        ELSE 'planned'
      END	as 'eventType',
      DATEADD(second, theoreticalDuration, startTime) as endTime,
      *
    FROM (
      SELECT
        d.PLANKEY AS planKey,
        d.RECORDTIME as recordTime,
        d.JOBORDER as jobOrder,
        c.VALUE as fabricWeight,
        d.PLANNEDMACHINE as machineId,
        d.PRGCOUNT as programCount,
        d.PROGRAMNOLIST as programList,
        CASE
          WHEN p.PLANKEY IS NULL THEN d.PLANNEDSTARTTIME
          ELSE CASE
                WHEN p.QUEUENUMBER = 1 THEN GETUTCDATE()
                ELSE DATEADD(second, COALESCE(
                      SUM(CASE
                    WHEN d.TheoricalDuration = 0 THEN 28800
                  ELSE d.TheoricalDuration
                END + 300) OVER (PARTITION BY d.MACHINEIDLIST ORDER BY p.QUEUENUMBER ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0), GETUTCDATE())
              END
        END as startTime,
        d.NOTE as note,
        d.TheoricalDuration as theoreticalDuration,
        d.Color as fabricColor,
        d.CUSTOMERNAME as customer,
        p.QUEUENUMBER as queueNumber,
        p.PINNED as pinned
      FROM DYBFBATCHPLAN d
      LEFT JOIN PTBATCHPLANQUEUE p ON p.PLANKEY = d.PLANKEY
      LEFT JOIN DYBFBATCHPLANPARAMETERS c ON c.PLANKEY = d.PLANKEY AND c.PARAMSTRING = 'Kilo'
      WHERE d.ISDELETED IS NULL OR d.ISDELETED = 0
    ) as subquery
  ) SELECT * FROM nonActualEvents
  WHERE eventType = 'planned' and startTime BETWEEN ? AND ?
  ORDER BY machineId, queueNumber
  `, [startDate, endDate])

  return events.map(ev => ({
    ...ev,
    theoreticalDuration: ev.theoreticalDuration === 0 ? 28800 : ev.theoreticalDuration,
    erpParameters: ev.erpParameters ? Object.fromEntries(JSON.parse(ev.erpParameters).map(a => [a.paramName, a.value])) : [],
  }))
}

export async function getQueueBasedActualEvents(startTime: string, endTime: string): Promise<QueueBasedActualEvent[]> {
  return await knex.raw(`
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
              DATEADD(SECOND, theoreticalDuration, startTime) > DATEADD(MINUTE, :timezoneOffset, GETUTCDATE()),
              DATEADD(SECOND, theoreticalDuration, startTime),
              DATEADD(MINUTE, :timezoneOffset, GETUTCDATE())
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
      WHERE (startTime > CAST(? AS DATETIME)
      OR (endTime BETWEEN CAST(? AS DATETIME) AND CAST(? AS DATETIME) OR endTime IS NULL))
  `, [{ timezoneOffset: config.teleskopTimezoneOffset, startTime, endTime }])
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
