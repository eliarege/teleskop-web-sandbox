import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { reasonIds } = await readBody(event)
    const res = await knex('BFSTEPSKIPPINGREASONS')
      .whereIn('ID', reasonIds)
      .del()
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
