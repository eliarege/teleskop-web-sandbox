import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/machine', router.handler)

router.get('/machines', defineEventHandler(async () => {
  try {
    const machines = await knex('BFMACHINES')
      .select(
        'MACHINEID',
        'MACHINECODE',
        'TBBMODEL',
        'VERSION',
        'MACHINECAPACITY',
        'IP',
        'INUSE',
        'PlcModel',
        'NOZZLECOUNT',
        'GROUPNAME',
      )
      .leftJoin('BFMACHGROUP', 'BFMACHINES.GRUPNO', 'BFMACHGROUP.GROUPID')
      .where('GRUPNO', '!=', -1)
      .orderBy('MACHINEID')
    return machines
  } catch (e) {
    return e
  }
}))

router.get('/machine-group', defineEventHandler(async () => {
  try {
    const machineGroups = await knex('BFMACHGROUP').select('GROUPNAME')
    return machineGroups.map(obj => obj.GROUPNAME)
  } catch (e) {
    return e
  }
}))
