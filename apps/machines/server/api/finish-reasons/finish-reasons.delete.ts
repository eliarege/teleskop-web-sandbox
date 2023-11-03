import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { reasonIds } = await readBody(event)
    console.log('reasonIds = ', reasonIds)
    const res = await knex('BFDYLOTFINISHREASONS').whereIn('REASONID', reasonIds).del()
    return res
  } catch (e) {
    return e
  }
})
