import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
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
  } catch (e) {
    return e
  }
})
