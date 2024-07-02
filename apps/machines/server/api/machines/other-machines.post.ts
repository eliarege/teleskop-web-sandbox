import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters } = await readBody(event)
  const selectParams = {
    machineId: 'MACHINEID',
    machineCode: 'MACHINECODE',
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
    filtersToKnex(filters, selectParams, query)

  return await query
})
