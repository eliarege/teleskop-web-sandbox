import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineEventHandler(async () => {
  try {
    const machines: Machine[] = await knex('BFMACHINES')
      .select({
        id: 'MACHINEID',
        code: 'MACHINECODE',
        tbbModel: 'TBBMODEL',
        version: 'VERSION',
        machineCapacity: 'MACHINECAPACITY',
        ip: 'IP',
        inUse: 'INUSE',
        plcModel: 'PlcModel',
        nozzleCount: 'NOZZLECOUNT',
        groupName: 'GROUPNAME',
        groupId: 'GRUPNO',
      },
      )
      .leftJoin('BFMACHGROUP', 'BFMACHINES.GRUPNO', 'BFMACHGROUP.GROUPID')
      .where('GRUPNO', '!=', -1)
      .orderBy('MACHINEID')
    return machines
  } catch (e) {
    return e
  }
})
