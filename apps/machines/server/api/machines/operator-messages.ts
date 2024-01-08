import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { filters } = await readBody(event)
    const selectParams = {
      id: 'ID',
      userId: 'USERID',
      operator: 'OPERATOR',
      machineId: 'MACHINEID',
      messageTitle: 'MESSAGETITLE',
      message: 'MESSAGE',
      sentDate: 'SENTDATE',
      runningBatchKey: 'RUNNINGBATCHKEY',
    }
    const query = knex('BAOPERATORMESSAGES')
      .select(selectParams)

    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query

})
