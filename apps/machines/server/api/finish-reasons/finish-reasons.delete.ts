import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { reasonIds } = await readBody(event)
  const res = await knex('BFDYLOTFINISHREASONS').whereIn('REASONID', reasonIds).del()
  return res
})
