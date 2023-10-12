/* eslint-disable ts/no-invalid-this */
import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/consumption', router.handler)

// TODO: Body type will be added
router.post('/theoretical', defineEventHandler(async (event) => {
  const { joborder } = getQuery(event)
  const consumptions = await knex('DYTACONSUMPTION')
    .where('JOBRODERCODE', joborder)
  return consumptions
}))
