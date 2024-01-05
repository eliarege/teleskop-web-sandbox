import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const { filters } = await readBody(event)
    const selectParams = {
      machineId: 'MACHINEID',
      machineCode: 'MACHINECODE',
      tbbModel: 'TBBMODEL',
      version: 'VERSION',
      machineCapacity: 'MACHINECAPACITY',
      ip: 'IP',
      inUse: 'INUSE',
      plcModel: 'PlcModel',
      nozzleCount: 'NOZZLECOUNT',
      groupName: 'GROUPNAME',
      groupId: 'GRUPNO',
    }

    const query = knex('BFMACHINES')
      .select(selectParams)
      .leftJoin('BFMACHGROUP', 'BFMACHINES.GRUPNO', 'BFMACHGROUP.GROUPID')
      .where('GRUPNO', '!=', -1)
      .orderBy('MACHINEID')

    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query
    return machines
  } catch (e) {
    return e
  }
})
