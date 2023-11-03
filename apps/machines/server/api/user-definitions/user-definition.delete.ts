import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { userIds } = await readBody(event)
    const res = await knex('BFUSERS').whereIn('userID', userIds).del()
    return res
  } catch (e) {
    return e
  }
})
