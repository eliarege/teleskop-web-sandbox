import { filtersToKnex } from 'utils'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters } = await readBody(event)

  const selectParams = {
    waterTypeId: 'waterTypeId',
    waterTypeName: 'waterTypeName',
  }
  const query = knex('BFWaterTypes').select(selectParams)

  if (filters)
    filtersToKnex(filters, selectParams, query)

  return await query
})
