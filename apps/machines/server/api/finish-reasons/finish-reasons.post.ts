import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
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
      return await filtersToKnex(filters, selectParams, query)

    return await query
  } catch (e) {
    return e
  }
})
