import { filtersToKnex } from 'utils'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { filters } = await readBody(event)
    const selectParams = {
      stopCode: 'STOPCODE',
      stopName: 'STOPNAME',
      reportToERP: 'ReportToERP',
    }

    const query = knex('BFSTOPREASONS').select(selectParams)

    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query
  } catch (e) {
    return e
  }
})
