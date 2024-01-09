import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, filters } = await readBody(event)

  const selectParams = {
    id: 'MACHINEPARAMETERID',
    paramString: 'PARAMSTRING',
    defaultValue: 'DEFAULTVALUE',
    paramLowLimit: 'PARAMLOWLIMIT',
    paramHighLimit: 'PARAMHIGHLIMIT',
    dmArea: 'dmArea',
    consScreen: 'consScreen',
    consFormat: 'consFormat',
    consUnit: 'consUnit',
    currentValue: 'currentValue',
  }

  const query = knex('BFMACHPARAMETERS')
    .select(selectParams)
    .where('MACHINEID', machineId)

  if (filters)
    return await filtersToKnex(filters, selectParams, query)

  return await query
})
