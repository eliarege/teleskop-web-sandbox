import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { userId, userMode, userMode2 } = await readBody(event)
  const res = await knex('BFUSERS').where({
    userID: userId,
  }).update({
    userMode,
    userMode2,
  })
  return res
})
