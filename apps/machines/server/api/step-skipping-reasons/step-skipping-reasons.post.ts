import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { filters } = await readBody(event)
    const selectParams = {
      id: 'ID',
      reasonText: 'REASONTEXT',
    }

    const query = knex('BFSTEPSKIPPINGREASONS').select(selectParams)

    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query
  } catch (err) {
    console.error(err)
  }
})
