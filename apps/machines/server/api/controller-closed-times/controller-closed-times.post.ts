import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { filters, machineIds, closedTypes } = await readBody(event)
    const selectParams = {
      machineId: 'BACONTROLLERCLOSEDTIMES.MACHINEID',
      machineName: 'MACHINECODE',
      autoKey: 'AUTOKEY',
      startTime: 'STARTTIME',
      endTime: 'ENDTIME',
      duration: 'DURATION',
      closedType: 'CLOSEDTYPE',
      archived: 'ARCHIVED',
    }
    const query = knex('BACONTROLLERCLOSEDTIMES')
      .leftJoin('BFMACHINES', 'BFMACHINES.MACHINEID', 'BACONTROLLERCLOSEDTIMES.MACHINEID')
      .whereIn('BACONTROLLERCLOSEDTIMES.MACHINEID', machineIds)
      .whereIn('CLOSEDTYPE', closedTypes)
      .select(selectParams)
    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query
  } catch (e) {
    return e
  }
})
