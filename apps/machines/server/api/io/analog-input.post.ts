import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, filters } = await readBody(event)

  const selectParams = {
    id: 'ID',
    name: 'NAME',
  }

  const query = knex('BFMACHAIN')
    .select(selectParams)
    .where('MACHINEID', machineId)

  if (filters)
    filtersToKnex(filters, selectParams, query)

  return await query
})
