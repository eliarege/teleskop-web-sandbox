import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const ids = await readBody(event)
  const res = await knex('BFWaterTypes').whereIn('waterTypeId', ids).del()
  return res
})
