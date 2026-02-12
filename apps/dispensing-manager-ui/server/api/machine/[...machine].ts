import { createRouter, useBase } from 'h3'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/machine', router.handler)

router.get('/machines', defineAuthEventHandler(async (event) => {
  const machines = await knex('DYTFMACHINES')
    .select({
      machineName: 'MACHINENAME',
      machineId: 'MACHINEID',
      machineCode: 'MACHINENAME',
      controllerType: 'CONTROLLERTYPE',
    })
    .orderBy('MACHINEID')
  return machines
}))

router.get('/machine', defineAuthEventHandler(async (event) => {
  const { joborder, correctionNo } = getQuery(event)
  const machineId = knex('DYBFBATCHPLAN')
    .select('PLANNEDMACHINE')
    .where('JOBORDER', joborder)
    .andWhere('CORRECTIONNUMBER', correctionNo)

  const machine = await knex('DYTFMACHINES')
    .select({
      machineName: 'MACHINENAME',
      machineId: 'MACHINEID',
      controllerType: 'CONTROLLERTYPE',
    })
    .where('MACHINEID', machineId)
  return machine[0]
}))

router.get('/machineId', defineAuthEventHandler(async (event) => {
  const { plankey } = getQuery(event)
  const machineId = await knex('DYBFBATCHPLAN')
    .select('PLANNEDMACHINE')
    .where('PLANKEY', Number(plankey))

  return machineId
}))

router.post('/control-dispenser-type-by-machineId', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const dispensers = await knex('DYTFMACHDISPCONNECTION as M')
    .where('M.MACHINEID', body.machineId)
    .andWhere('D.DISPENSERTYPENO', body.dispenserType)
    .leftJoin('DYTFDISPENSERSETTINGS as D', 'M.DISPENSERID', 'D.DISPENSERID')

  if (dispensers.length)
    return true
  return false
}))
