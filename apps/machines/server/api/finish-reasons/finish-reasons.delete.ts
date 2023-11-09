import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { reasonIds } = await readBody(event)
    const res = await knex('BFDYLOTFINISHREASONS').whereIn('REASONID', reasonIds).del()
    return res
  } catch (e) {
    return e
  }
})
