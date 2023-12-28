import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { filters } = await readBody(event)
    const selectParams = {
      machineId: 'MACHINEID',
      machineName: 'MACHINECODE',
      inUse: 'INUSE',
    }
    const query = knex('BFMACHINES')
      .where({
        USEINTELESKOP: false,
        GRUPNO: -1,
      })
      .select(selectParams)
      .orderBy('MACHINEID')
    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query
  } catch (e) {
    return e
  }
})
