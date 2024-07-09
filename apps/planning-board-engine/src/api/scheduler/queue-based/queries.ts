import { start } from 'node:repl'
import type { QueueBasedActualEventRaw, QueueBasedEventsBase, QueueBasedPlannedEventRaw } from '../../../../types/planning-board'
import { queueBasedEventStatus } from '../../../composables/helper'
import { knex } from '../../../knexConfig'
import { getMachineIds, planningBoardStops } from '../queries'
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
  const machines = await getMachineIds()
  if (includeStops) {
    const stops = await planningBoardStops(startDate, endDate)
    const merged = [...actualEvents, ...stops]
    return queueBasedEventStatus([...plannedEvents, ...merged], includeStops)
  } else return queueBasedEventStatus([...plannedEvents, ...actualEvents], includeStops)
}

export async function getQueueBasedPlannedEvents(startDate: string, endDate: string): Promise<QueueBasedPlannedEventRaw[]> {
  return await knex.raw(`
      select *, DATEADD(second, theoreticalDuration, startTime) as endTime from (
      select
        'planned' as eventType,
        p.MACHINEID as machineId,
        CASE
          WHEN p.QUEUENUMBER = 1 THEN GETUTCDATE()
          ELSE DATEADD(second, COALESCE(
                SUM(CASE
              WHEN d.TheoricalDuration = 0 THEN 28800
            ELSE d.TheoricalDuration
          END + 300) OVER (PARTITION BY d.MACHINEIDLIST ORDER BY p.QUEUENUMBER ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0), GETUTCDATE())
        END as startTime,
        d.NOTE as note,
        p.PLANKEY as planKey,
        d.JOBORDER as jobOrder,
        d.PROGRAMNOLIST as programNoList,
        CASE
          WHEN d.TheoricalDuration = 0 THEN 28800
              ELSE d.TheoricalDuration
        END as theoreticalDuration,
        (SELECT r.VALUE FROM DYBFBATCHPLANPARAMETERS r WHERE r.PARAMSTRING = 'Kilo' AND r.PLANKEY = p.PLANKEY) AS fabricWeight,
        d.Color as fabricColor,
        CAST(1 as bit) as isPlanned,
        d.ISDELETED as isDeleted,
        d.ISSTARTED as isStarted,
        d.ISSTOPPED as isStopped,
        p.QUEUENUMBER as queueNumber,
        p.PINNED as pinned
      from PTBATCHPLANQUEUE p
      left join DYBFBATCHPLAN d ON p.PLANKEY = d.PLANKEY
        WHERE d.ISDELETED IS NULL OR d.ISDELETED = 0
      ) as subquery
        WHERE
            startTime BETWEEN ? AND ?
        ORDER BY
            machineId, queueNumber
  `, [startDate, endDate])
}

export async function getQueueBasedActualEvents(startTime: string, endTime: string): Promise<QueueBasedActualEventRaw[]> {
  return await knex.raw(`
        WITH RankedBatches AS (
      select
        'finished' as eventType,
        b.MACHINEID as machineId,
        DATEADD(MINUTE, :timezoneOffset, b.STARTTIME) as startTime,
        DATEADD(MINUTE, :timezoneOffset, COALESCE(b.ENDTIME, b.CANCELTIME, CURRENT_TIMESTAMP)) as endTime,
        d.NOTE as note,
        b.PLANKEY as planKey,
        b.JOBORDER as jobOrder,
        b.PROGRAMNOLIST as programNoList,
        b.THEORETICDURAT AS theoreticalDuration,
        b.FABRIC_WEIGHT AS fabricWeight,
        d.Color as fabricColor,
        CAST(0 as bit) as isPlanned,
        d.ISDELETED as isDeleted,
          d.ISSTARTED as isStarted,
          d.ISSTOPPED as isStopped,
          b.BATCHKEY as batchKey,
          b.DEVIATION as deviation,
          ROW_NUMBER() OVER (PARTITION BY b.PLANKEY ORDER BY b.BATCHREFERENCE DESC) AS rowNum
      from BADATA b
      left join DYBFBATCHPLAN d ON d.PLANKEY = b.PLANKEY
    )
      SELECT
        eventType,
        machineId,
        startTime,
        endTime,
        note,
        planKey,
        jobOrder,
        programNoList,
        theoreticalDuration,
        fabricWeight,
        fabricColor,
        isPlanned,
        isDeleted,
        isStarted,
        isStopped,
        batchKey,
        deviation,
        rowNum
      FROM RankedBatches
        WHERE rowNum = 1
        AND startTime >= :startTime
        OR (endTime BETWEEN :startTime AND :endTime OR endTime IS NULL)
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
