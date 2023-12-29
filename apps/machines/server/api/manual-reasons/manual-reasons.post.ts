import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { filters } = await readBody(event)
    const selectParams = {
      manualId: 'manualID',
      manualReason: 'manualString',
      reportToERP: 'ReportToERP',
    }
    const query = knex('BFMANUALREASONSGENERAL')
      .select(selectParams)

    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query
  } catch (e) {
    return e
  }
})
