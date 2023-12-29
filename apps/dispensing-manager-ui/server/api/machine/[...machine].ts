import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/machine', router.handler)

router.get('/machines', defineEventHandler(async (event) => {
  try {
    const machines = await knex('DYTFMACHINES')
      .select({
        machinename: 'MACHINENAME',
        machineid: 'MACHINEID',
        controllerType: 'CONTROLLERTYPE',
      })
      .orderBy('MACHINEID')
    return machines
  } catch (e) {
    return e
  }
}))

router.get('/machine', defineEventHandler(async (event) => {
  const { joborder, correctionNo } = getQuery(event)
  const machineid = knex('DYBFBATCHPLAN')
    .select('PLANNEDMACHINE')
    .where('JOBORDER', joborder)
    .andWhere('CORRECTIONNUMBER', correctionNo)

  const machine = await knex('DYTFMACHINES')
    .select({
      machinename: 'MACHINENAME',
      machineid: 'MACHINEID',
      controllerType: 'CONTROLLERTYPE',
    })
    .where('MACHINEID', machineid)
  return machine[0]
}))

router.get('/machineid', defineEventHandler(async (event) => {
  const { plankey } = getQuery(event)
  const machineid = await knex('DYBFBATCHPLAN')
    .select('PLANNEDMACHINE')
    .where('PLANKEY', Number(plankey))

  return machineid
}))

router.post('/control-dispenser-type-by-machineid', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const dispensers = await knex('DYTFMACHDISPCONNECTION as M')
    .where('M.MACHINEID', body.machineid)
    .andWhere('D.DISPENSERTYPENO', body.dispenserType)
    .leftJoin('DYTFDISPENSERSETTINGS as D', 'M.DISPENSERID', 'D.DISPENSERID')

  if (dispensers.length)
    return true
  return false
}))
