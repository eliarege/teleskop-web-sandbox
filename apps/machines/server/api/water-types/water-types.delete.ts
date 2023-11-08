import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { ids } = await readBody(event)
    const res = await knex('BFWaterTypes').whereIn('waterTypeId', ids).del()
    return res
  } catch (e) {
    return e
  }
})
