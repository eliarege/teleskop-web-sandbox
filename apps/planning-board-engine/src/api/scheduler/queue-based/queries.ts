import { STATUS_CODES } from 'node:http'
import { addSeconds } from 'date-fns'
import type { QueueBasedPlannedEventsRaw } from '../../../../types/planning-board'
import { knex } from '../../../knexConfig'
import { updateArchiveQueueEventStates, updateRawQueueEventStates } from './helper'

export interface EventReschedule {
  planKey: number
  machineId: number
  queueNumber: number
}
// GET
export async function getEvents(startDate: string, endDate: string) {
  const plannedEvents = updateRawQueueEventStates(await getQueueBasedPlannedEvents(startDate, endDate))
  const archiveEvents = updateArchiveQueueEventStates(await getQueueBasedArchiveEvents(startDate, endDate))
  return [...plannedEvents, ...archiveEvents]
}
export async function getQueueBasedPlannedEvents(startDate: string, endDate: string) {
  const events: QueueBasedPlannedEventsRaw[] = await knex.raw(`
  SELECT *
  FROM (
      SELECT
          p.PLANKEY AS planKey,
          p.MACHINEID AS machineId,
          CASE
              WHEN p.QUEUENUMBER = 1 THEN CURRENT_TIMESTAMP
              ELSE DATEADD(second, COALESCE(
              SUM(CASE
                  WHEN d.TheoricalDuration = 0 THEN 28800
                  ELSE d.TheoricalDuration
              END + 300) OVER (PARTITION BY d.MACHINEIDLIST ORDER BY p.QUEUENUMBER ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0), CURRENT_TIMESTAMP)
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
          d.Color AS color
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
  return updateRawQueueEventStates(events.map(ev => ({
    ...ev,
    startDate: ev.plannedStartDate,
    endDate: addSeconds(ev.plannedStartDate, ev.theoreticalDuration),
  })))
}

export async function getQueueBasedArchiveEvents(startDate: string | Date, endDate: string | Date) {
  const events = await knex.raw(`
  WITH RankedBatches AS (
    SELECT
      p.BATCHKEY as batchKey,
      p.PLANKEY AS planKey,
      p.MACHINEID AS machineId,
      p.JOBORDER AS jobOrder,
      p.PROGRAMNOLIST AS programNoList,
      p.STARTTIME AS startTime,
      p.ENDTIME as endTime,
      p.CANCELTIME as cancelTime,
      p.THEORETICDURAT AS theoreticalDuration,
      p.FABRIC_WEIGHT AS fabricWeight,
      p.PARTYNUMBER AS partyNumber,
      p.DEVIATION as deviation,
      d.NOTE AS note,
      d.ISDELETED AS isDeleted,
      d.ISSTARTED AS isStarted,
      d.ISSTOPPED AS isStopped,
      d.Color as color,
      ROW_NUMBER() OVER (PARTITION BY p.PLANKEY ORDER BY p.BATCHREFERENCE DESC) AS RowNum
    FROM
      BADATA AS p
      LEFT JOIN DYBFBATCHPLAN d ON d.PLANKEY = p.PLANKEY
    WHERE
      p.STARTTIME BETWEEN ? AND ?
      AND (d.ISDELETED IS NULL OR d.ISDELETED = 0)
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
    cancelTime,
    theoreticalDuration,
    fabricWeight,
    partyNumber,
    deviation,
    note,
    isDeleted,
    isStarted,
    isStopped,
    color
  FROM RankedBatches
  WHERE RowNum = 1;
  `, [startDate, endDate])

  return updateArchiveQueueEventStates(events.map(ev => ({
    ...ev,
    endDate: ev.endTime ? ev.endTime : ev.cancelTime,
    startDate: ev.startTime,
  })))
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
        QUEUENUMBER: -1,
      })
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
