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
    const machineGroups = await knex('BFMACHGROUP').select('GROUPNAME', 'GROUPID')
    return machineGroups
  } catch (e) {
    return e
  }
}))

router.post('/machine-add', defineEventHandler(async (event) => {
  try {
    const machine = await readBody(event)
    const res = await knex('BFMACHINES').insert({
      MACHINEID: machine.no,
      MACHINECODE: machine.name,
      GRUPNO: machine.group.GROUPID,
      TBBMODEL: machine.model,
      THEORICALCHARGE: machine.theoricalCharge,
      MACHINECAPACITY: machine.machineCapacity,
      IP: machine.ip,
      PORT: -1,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
}))

router.post('/machine-delete', defineEventHandler(async (event) => {
  try {
    const { machineIds } = await readBody(event)
    const res = await knex('BFMACHINES').whereIn('MACHINEID', machineIds).del()
    return res
  } catch (e) {
    return e
  }
}))
