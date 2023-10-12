import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/joborder', router.handler)

router.get('/joborders', defineEventHandler(async (event) => {
  try {
    const orders = await knex('DYBFBATCHPLAN as b')
      .select({
        joborder: 'b.JOBORDER',
        correctionNo: 'b.CORRECTIONNUMBER',
        plannedMachineName: 'm.MACHINENAME',
        plannedMachineID: 'b.PLANNEDMACHINE',
        programList: 'b.PROGRAMNOLIST',
        plannedStartTime: 'b.PLANNEDSTARTTIME',
      })
      .join('dbo.DYTFMACHINES as m', 'b.PLANNEDMACHINE', 'm.MACHINEID')
      .limit(30)
      .orderBy('b.PLANNEDSTARTTIME', 'desc')
    return orders
  } catch (e) {
    return e
  }
}))

router.get('/filtered-joborders', defineEventHandler(async (event) => {
  try {
    const { joborder, machineid, startdate, enddate } = getQuery(event)
    const orders = await knex('DYBFBATCHPLAN as b')
      .select({
        joborder: 'b.JOBORDER',
        correctionNo: 'b.CORRECTIONNUMBER',
        plannedMachineName: 'm.MACHINENAME',
        plannedMachineID: 'b.PLANNEDMACHINE',
        programList: 'b.PROGRAMNOLIST',
        plannedStartTime: 'b.PLANNEDSTARTTIME',
      })
      .join('dbo.DYTFMACHINES as m', 'b.PLANNEDMACHINE', 'm.MACHINEID')
      .orderBy('b.JOBORDER', 'b.CORRECTIONNUMBER')
      .where((builder) => {
        if (joborder)
          builder.where('b.JOBORDER', joborder)
        if (machineid)
          builder.where('b.PLANNEDMACHINE', '=', Number(machineid))
        if (startdate && enddate)
          builder.where('b.PLANNEDSTARTTIME', '<=', enddate).andWhere('b.PLANNEDSTARTTIME', '>=', startdate)
      })
    return orders
  } catch (e) {
    return e
  }
}))
