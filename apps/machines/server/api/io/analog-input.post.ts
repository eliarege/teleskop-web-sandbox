import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { machineId, filters } = await readBody(event)

    const selectParams = {
      id: 'ID',
      name: 'NAME',
    }

    const query = knex('BFMACHAIN')
      .select(selectParams)
      .where('MACHINEID', machineId)

    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query

})
