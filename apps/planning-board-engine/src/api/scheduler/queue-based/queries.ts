import type { QueueBasedActualEventsRaw, QueueBasedPlannedEventsRaw } from '../../../../types/planning-board'
import { queueBasedEventStatus } from '../../../composables/helper'
import { knex } from '../../../knexConfig'
import { getMachineIds, getMachines } from '../queries'
import { mergeEvents } from './helper'
import { config } from '~/config'

export interface EventReschedule {
  planKey: number
  machineId: number
  queueNumber: number
}
// GET
export async function getQueueBasedEvents(startDate: string, endDate: string) {
  const plannedEvents = await getQueueBasedPlannedEvents(startDate, endDate)
  const actualEvents = await getQueueBasedActualEvents(startDate, endDate)

  const machines = await getMachineIds()

  return queueBasedEventStatus(mergeEvents(plannedEvents, actualEvents), machines)
}

export async function getQueueBasedPlannedEvents(startDate: string, endDate: string): Promise<QueueBasedPlannedEventsRaw[]> {
  const events = await knex.raw(`
  SELECT *
  FROM (
      SELECT
          p.PLANKEY AS planKey,
          p.MACHINEID AS machineId,
          CASE
              WHEN p.QUEUENUMBER = 1 THEN GETUTCDATE()
              ELSE DATEADD(second, COALESCE(
              SUM(CASE
                  WHEN d.TheoricalDuration = 0 THEN 28800
                  ELSE d.TheoricalDuration
              END + 300) OVER (PARTITION BY d.MACHINEIDLIST ORDER BY p.QUEUENUMBER ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0), GETUTCDATE())
          END as plannedStartDate,
          p.QUEUENUMBER AS queueNumber,
          d.JOBORDER AS jobOrder,
          d.PROGRAMNOLIST AS programNoList,
          CASE
              WHEN d.TheoricalDuration = 0 THEN 28800
              ELSE d.TheoricalDuration
          END AS theoreticalDuration,
          (SELECT r.VALUE FROM DYBFBATCHPLANPARAMETERS r WHERE r.PARAMSTRING = 'Kilo' AND r.PLANKEY = p.PLANKEY) AS fabricWeight,
          d.PARTYNUMBER AS partyNumber,
          p.PINNED AS pinned,
          d.NOTE AS note,
          d.ISDELETED AS isDeleted,
          d.ISSTARTED AS isStarted,
          d.ISSTOPPED AS isStopped,
          d.STARTDATETIME AS startDate,
          d.CUSTOMERNAME AS customerName,
          d.Color AS color,
          CAST(1 as bit) as 'isPlanned'
      FROM
          PTBATCHPLANQUEUE p
      LEFT JOIN
          DYBFBATCHPLAN d ON d.PLANKEY = p.PLANKEY
      WHERE
          d.ISDELETED IS NULL OR d.ISDELETED = 0
  ) AS subquery
  WHERE
      plannedStartDate BETWEEN ? AND ?
  ORDER BY
      machineId, queueNumber
  `, [startDate, endDate])

  return events.map(ev => ({
    ...ev,
    percentDone: 0,
  }))
}

export async function getQueueBasedActualEvents(startDate: string, endDate: string): Promise<QueueBasedActualEventsRaw[]> {
  const events = await knex.raw(`
  WITH RankedBatches AS (
    SELECT
      p.BATCHKEY as batchKey,
      p.PLANKEY AS planKey,
      p.MACHINEID AS machineId,
      p.JOBORDER AS jobOrder,
      p.PROGRAMNOLIST AS programNoList,
      DATEADD(MINUTE, :timezoneOffset, p.STARTTIME) AS startTime,
      DATEADD(MINUTE, :timezoneOffset, IIF(p.ENDTIME IS NULL, p.CANCELTIME, p.ENDTIME)) AS endTime,
      p.THEORETICDURAT AS theoreticalDuration,
      p.FABRIC_WEIGHT AS fabricWeight,
      p.PARTYNUMBER AS partyNumber,
      p.DEVIATION as deviation,
      d.NOTE AS note,
      d.ISDELETED AS isDeleted,
      d.ISSTARTED AS isStarted,
      d.ISSTOPPED AS isStopped,
      d.Color as color,
      d.CUSTOMERNAME AS customerName,
      CAST(0 as bit) as 'isPlanned',
      ROW_NUMBER() OVER (PARTITION BY p.PLANKEY ORDER BY p.BATCHREFERENCE DESC) AS RowNum
    FROM
      BADATA AS p
      LEFT JOIN DYBFBATCHPLAN d ON d.PLANKEY = p.PLANKEY
    WHERE (d.ISDELETED IS NULL OR d.ISDELETED = 0)
      AND d.ISSTARTED = 1
  )
  SELECT
    batchKey,
    planKey,
    machineId,
    jobOrder,
    programNoList,
    startTime,
    endTime,
    theoreticalDuration,
    fabricWeight,
    partyNumber,
    deviation,
    note,
    isDeleted,
    isStarted,
    isStopped,
    isPlanned,
    color
  FROM RankedBatches
  WHERE RowNum = 1
  AND startTime >= :startDate
  OR (endTime BETWEEN :startDate AND :endDate OR endTime IS NULL)
  `, { timezoneOffset: config.teleskopTimezoneOffset, startDate, endDate })

  return events.map(ev => ({
    ...ev,
    percentDone: ev.deviation > 0 ? 100 - ((ev.deviation / ev.theoreticalDuration) * 100) : 0,
  }))
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
