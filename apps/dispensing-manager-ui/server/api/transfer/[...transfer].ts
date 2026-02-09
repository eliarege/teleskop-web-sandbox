import { createRouter, useBase } from 'h3'
import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

const router = createRouter()
const config = useRuntimeConfig()

export default useBase('/api/transfer', router.handler)

const selectParameters = {
  id: 'ti.ID',
  jobOrder: 'ti.JOBORDER',
  correctionNo: 'ti.CORRECTIONNUMBER',
  machineId: 'ti.MACHINEID',
  machineCode: 'm.MACHINECODE',
  transferDate: knex.raw('DATEADD(MINUTE, ?, ti.TRANSFERDATE)', [config.teleskopTimezoneOffset]),
  transferType: knex.raw('CASE WHEN ti.TRANSFERTYPE = 1 THEN 0 ELSE ti.TRANSFERTYPE END'),
  transferStatus: 'ti.TRANSFERSTATUS',
  transferSource: 'ti.TRANSFERSOURCE',
}

router.post('/list', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const knexInstance: any = knex('DYBFBATCHTRANSFERINFO as ti')
    .join('BFMACHINES as m', 'ti.MACHINEID', 'm.MACHINEID')

  if (body.filters && body.filters?.length > 0) {
    const transferTypeFilterIndex = body.filters.findIndex((f: any) => f.name === 'transferType')
    if (transferTypeFilterIndex !== -1) {
      const transferTypeFilter = body.filters[transferTypeFilterIndex]
      if (transferTypeFilter.value?.option?.includes(0)) {
        knexInstance.whereIn('ti.TRANSFERTYPE', [0, 1])
        body.filters = body.filters.filter((_: any, index: number) => index !== transferTypeFilterIndex)
      }
    }
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

router.get('/:id/details', defineAuthEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const details = await knex('DYBFBATCHTRANSFERINFODETAIL')
    .select('EXPLANATION as explanation')
    .where('MASTERID', id)

  return details
}))
