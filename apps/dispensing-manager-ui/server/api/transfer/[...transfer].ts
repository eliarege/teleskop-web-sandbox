import { createRouter, useBase } from 'h3'
import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/transfer', router.handler)

const selectParameters = {
  id: 'ti.ID',
  joborder: 'ti.JOBORDER',
  correctionNo: 'ti.CORRECTIONNUMBER',
  machineid: 'ti.MACHINEID',
  machinecode: 'm.MACHINECODE',
  transferDate: 'ti.TRANSFERDATE',
  transferType: 'ti.TRANSFERTYPE',
  transferStatus: 'ti.TRANSFERSTATUS',
  transferSource: 'ti.TRANSFERSOURCE',
}

router.get('/transfer-count', defineAuthEventHandler(async (_event) => {
  return (await knex('DYBFBATCHTRANSFERINFO')
    .count('* as count').first())!.count
}))

router.post('/transfers', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const knexInstance: any = knex('DYBFBATCHTRANSFERINFO as ti')
    .join('BFMACHINES as m', 'ti.MACHINEID', 'm.MACHINEID')

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
      knexInstance.orderBy('ti.TRANSFERDATE', 'desc')
    if (body.pagination.page && body.pagination.rowsPerPage) {
      const offset = (body.pagination.page - 1) * body.pagination.rowsPerPage
      knexInstance.limit(body.pagination.rowsPerPage).offset(offset)
    }
  } else {
    knexInstance.orderBy('ti.TRANSFERDATE', 'desc')
  }

  return { rows: await knexInstance, count }
}))

router.get('/transfer-details/:id', defineAuthEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const details = await knex('DYBFBATCHTRANSFERINFODETAIL')
    .select('EXPLANATION as explanation')
    .where('MASTERID', id)

  return details
}))
