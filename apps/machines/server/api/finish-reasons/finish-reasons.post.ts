import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters } = await readBody(event)
  const selectParams = {
    reasonId: 'REASONID',
    typeId: 'TYPEID',
    text: 'TEXT',
    reportToERP: 'ReportToERP',
  }
  const query = knex('BFDYLOTFINISHREASONS')
    .select(selectParams)

  if (filters)
    filtersToKnex(filters, selectParams, query)

  return await query
})
