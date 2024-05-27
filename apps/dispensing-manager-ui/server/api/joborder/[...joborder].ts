import { createRouter, defineEventHandler, useBase } from 'h3'
import type { Knex } from 'knex'
import { knex } from '~/server/connectionPool'
import { filtersToKnex, returnDBCol } from '~/shared/functions'

const router = createRouter()
export default useBase('/api/joborder', router.handler)

router.get('/joborders', defineEventHandler(async (event) => {
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
    .orderBy('b.PLANNEDSTARTTIME', 'desc')
  return orders
}))

const selectParameters = {
  joborder: 'b.JOBORDER',
  correctionNo: 'b.CORRECTIONNUMBER',
  plannedMachineName: 'm.MACHINENAME',
  machineid: 'b.PLANNEDMACHINE',
  programList: 'b.PROGRAMNOLIST',
  plannedStartTime: 'b.PLANNEDSTARTTIME',
}
router.post('/filtered-joborders', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const ordersKnex: any = knex('DYBFBATCHPLAN as b')
    .join('dbo.DYTFMACHINES as m', 'b.PLANNEDMACHINE', 'm.MACHINEID')
    .orderBy('b.JOBORDER', 'b.CORRECTIONNUMBER')
    .select(selectParameters)
  if (body.length > 0)
    return await filtersToKnex(body, selectParameters, ordersKnex)
  else
    return await ordersKnex
}))
