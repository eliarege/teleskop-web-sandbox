import { createRouter, useBase } from 'h3'
import type { Knex } from 'knex'
import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/joborder', router.handler)

// router.get('/joborders', defineAuthEventHandler(async (event) => {
//   const orders = await knex('DYBFBATCHPLAN as b')
//     .select({
//       joborder: 'b.JOBORDER',
//       correctionNo: 'b.CORRECTIONNUMBER',
//       plannedMachineName: 'm.MACHINENAME',
//       plannedMachineID: 'b.PLANNEDMACHINE',
//       programList: 'b.PROGRAMNOLIST',
//       plannedStartTime: 'b.PLANNEDSTARTTIME',
//     })
//     .join('dbo.DYTFMACHINES as m', 'b.PLANNEDMACHINE', 'm.MACHINEID')
//     .orderBy('b.PLANNEDSTARTTIME', 'desc')
//   return orders
// }))

const selectParameters = {
  joborder: 'b.JOBORDER',
  correctionNo: 'b.CORRECTIONNUMBER',
  plannedMachineName: 'm.MACHINENAME',
  machineid: 'b.PLANNEDMACHINE',
  programList: 'b.PROGRAMNOLIST',
  plannedStartTime: 'b.PLANNEDSTARTTIME',
  recordTime: 'b.RECORDTIME',
}

router.get('/joborder-count', defineAuthEventHandler(async (event) => {
  return (await knex('DYBFBATCHPLAN')
    .count('* as count').first())!.count
}))
router.post('/joborders', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const knexInstance: any = knex('DYBFBATCHPLAN as b')
    .join('dbo.DYTFMACHINES as m', 'b.PLANNEDMACHINE', 'm.MACHINEID')

  if (body.filters && body.filters?.length > 0) {
    filtersToKnex(body.filters, selectParameters, knexInstance)
  }

  const countQuery = knexInstance.clone().count('* as count').first()
  const count = (await countQuery).count

  knexInstance.select(selectParameters)

  if (body.pagination) {
    if (body.pagination.sortBy)
      knexInstance.orderBy(selectParameters[body.pagination.sortBy], body.pagination.descending ? 'desc' : 'asc')
    else
      knexInstance.orderBy('b.RECORDTIME', 'desc')
    if (body.pagination.page && body.pagination.rowsPerPage) {
      const offset = (body.pagination.page - 1) * body.pagination.rowsPerPage
      knexInstance.limit(body.pagination.rowsPerPage).offset(offset)
    }
  }

  return { rows: await knexInstance, count }
}))
