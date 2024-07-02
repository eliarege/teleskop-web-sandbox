import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters } = await readBody(event)
  const selectParams = {
    manualId: 'manualID',
    manualReason: 'manualString',
    reportToERP: 'ReportToERP',
  }
  const query = knex('BFMANUALREASONSGENERAL')
    .select(selectParams)

  if (filters)
    filtersToKnex(filters, selectParams, query)

  return await query
})
