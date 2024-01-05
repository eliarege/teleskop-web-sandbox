import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, filters } = await readBody(event)

  const selectParams = {
    paramId: 'PARAMID',
    paramName: 'PARAMNAME',
    paramType: 'PARAMTYPE',
    erpFieldName: 'ERPFIELDNAME',
    batchReportVisible: 'BATCHREPORTVISIBLE',
    batchReportOrder: 'BATCHREPORTORDER',
    partyNoParam: 'PartyNoParam',
  }

  const query = knex('BFERPPARAMETERDEFINITIONS')
    .where({
      MACHINEID: machineId,
    })
    .select(selectParams)

  if (filters)
    return await filtersToKnex(filters, selectParams, query)

  return await query
})
