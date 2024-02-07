import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { reasonIds } = await readBody(event)
  console.log('reasonIds = ', reasonIds)
  const res = await knex('BFDYLOTFINISHREASONS').whereIn('REASONID', reasonIds).del()
  return res
})
