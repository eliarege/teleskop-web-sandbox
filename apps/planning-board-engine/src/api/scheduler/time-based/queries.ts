import { knex } from '../../../knexConfig'
import { config } from '~/config'

// GET
export async function getTimeBasedPlannedEvents() {
  return await knex({ p: 'dbo.PTBATCHPLANQUEUE' })
    .leftJoin('dbo.DYBFBATCHPLAN as d', 'd.PLANKEY', 'p.PLANKEY')
    .select({
      planKey: 'p.PLANKEY',
      machineId: 'p.MACHINEID',
      plannedStartTime: 'p.STARTTIME',
      jobOrder: 'd.JOBORDER',
      programNoList: 'd.PROGRAMNOLIST',
      theoreticalDuration: 'd.TheoricalDuration',
      fabricWeight: 'd.FABRICWEIGHT',
      pinned: 'p.PINNED',
      isStarted: 'd.ISSTARTED',
      isStopped: 'd.ISSTOPPED',
      color: 'd.Color',
    }).whereNotNull('p.STARTTIME')
}
export async function getTimeBasedEvents(archiveDays: number) {
  return await knex.raw(`
    WITH RankedBatches AS (
      SELECT
        P.BATCHKEY as batchKey,
        p.PLANKEY AS planKey,
        p.MACHINEID AS machineId,
        p.JOBORDER AS jobOrder,
        p.PROGRAMNOLIST AS programNoList,
        DATEADD(MINUTE, ?, p.STARTTIME) AS startTime,
        DATEADD(MINUTE, ?, IIF(p.ENDTIME IS NULL, p.CANCELTIME, p.ENDTIME)) AS endTime,
        p.THEORETICDURAT AS theoreticalDuration,
        p.FABRIC_WEIGHT AS fabricWeight,
        p.PARTYNUMBER AS partyNumber,
        p.DEVIATION as deviation,
        d.PLANNEDMACHINE as plannedMachineId,
        d.PLANNEDSTARTTIME as plannedStartTime,
        d.NOTE AS note,
        d.ISDELETED AS isDeleted,
        d.ISSTARTED AS isStarted,
        d.ISSTOPPED AS isStopped,
        d.Color as color,
        ROW_NUMBER() OVER (PARTITION BY p.PLANKEY ORDER BY p.BATCHREFERENCE DESC) AS RowNum
      FROM
        BADATA AS p
        LEFT JOIN DYBFBATCHPLAN d ON d.PLANKEY = P.PLANKEY
      WHERE
        p.STARTTIME BETWEEN DATEADD(DAY, ?, GETDATE()) AND GETDATE()
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
      theoreticalDuration,
      fabricWeight,
      partyNumber,
      deviation,
      plannedMachineId,
      plannedStartTime,
      note,
      isDeleted,
      isStarted,
      isStopped,
      color
    FROM RankedBatches
    WHERE RowNum = 1
`, [config.teleskopTimezoneOffset, config.teleskopTimezoneOffset, -archiveDays])
}
