import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { userIds } = await readBody(event)
  const res = await knex('BFUSERS').whereIn('userID', userIds).del()
  return res
})
