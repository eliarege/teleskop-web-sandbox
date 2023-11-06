import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const plannedEvents = knex('dbo.DYBFBATCHPLAN as d')
    .select({
      planKey: 'd.PLANKEY',
      recordTime: 'd.RECORDTIME',
      jobOrder: 'd.JOBORDER',
	    machineId: 'd.MACHINEIDLIST',
      partlyPlanned: 'd.PARTLYPLANNED',
      plannedMachine: 'd.PLANNEDMACHINE',
      startedMachine: 'd.STARTEDMACHINEID',
      isCorrection: 'd.ISCORRECTION',
      isCoupled: 'd.ISCOUPLED',
      programCount: 'd.PRGCOUNT',
      programNoList: 'd.PROGRAMNOLIST',
      plannedStartTime: 'd.PLANNEDSTARTTIME',
      actualStartTime: 'd.STARTDATETIME',
      note: 'd.NOTE',
      theoricalDuration: 'd.TheoricalDuration',
      fabricWeight: 'd.FABRICWEIGHT',
      customerName: 'd.CUSTOMERNAME',
    })
    .where('d.ISDELETED', '=', 0)
    .andWhereBetween('d.RECORDTIME', ['2023-07-01', '2023-07-19'])
  return plannedEvents
})
