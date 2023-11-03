import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const machines = await knex('BFMACHINES')
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
