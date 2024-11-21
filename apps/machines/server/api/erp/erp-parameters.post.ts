import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, filters } = await readBody(event)

  const selectParams = {
    machineId: 'MACHINEID',
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
    filtersToKnex(filters, selectParams, query)

  return await query
})
