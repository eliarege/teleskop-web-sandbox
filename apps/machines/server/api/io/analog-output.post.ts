import { filtersToKnex } from 'utils'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, filters } = await readBody(event)

  const selectParams = {
    id: 'ID',
    name: 'NAME',
  }
  const query = knex('BFMACHAOUT')
    .select(selectParams)
    .where('MACHINEID', machineId)

  if (filters)
    return await filtersToKnex(filters, selectParams, query)

  return await query
})
