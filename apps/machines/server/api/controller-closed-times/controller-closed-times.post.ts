import { filtersToKnex } from 'utils'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters } = await readBody(event)

  const selectParams = {
    machineId: 'BACONTROLLERCLOSEDTIMES.MACHINEID',
    machineCode: 'MACHINECODE',
    autoKey: 'AUTOKEY',
    startTime: 'STARTTIME',
    endTime: 'ENDTIME',
    duration: 'DURATION',
    closedType: 'CLOSEDTYPE',
    archived: 'ARCHIVED',
  }

  const query = knex('BACONTROLLERCLOSEDTIMES')
    .leftJoin('BFMACHINES', 'BFMACHINES.MACHINEID', 'BACONTROLLERCLOSEDTIMES.MACHINEID')
    .select(selectParams)

  if (filters)
    filtersToKnex(filters, selectParams, query)

  return await query
})
