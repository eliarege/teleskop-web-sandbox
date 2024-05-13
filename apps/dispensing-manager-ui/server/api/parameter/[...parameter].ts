import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/parameter', router.handler)

router.get('/parameters', defineEventHandler(async (event) => {
  const { plankey } = getQuery(event)
  const parameters = await knex('DYBFBATCHPLANPARAMETERS')
    .select({
      joborder: 'JOBORDER',
      parameter: 'PARAMSTRING',
      type: 'PARAMETERTYPE',
      value: 'VALUE',
      unit: 'UNITCODE',
      plankey: 'PLANKEY',
    })
    .where('PLANKEY', Number(plankey))
  return parameters
}))
