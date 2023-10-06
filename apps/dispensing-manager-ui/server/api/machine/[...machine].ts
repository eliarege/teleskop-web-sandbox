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
  return machine
}))
