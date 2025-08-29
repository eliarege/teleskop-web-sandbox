import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const user = await readBody(event)

  if (user.userId === undefined) {
    throw createError({
      statusCode: 400,
      message: 'userId is required',
    })
  }

  const res = await knex('BFUSERS')
    .where({ userID: user.userId })
    .update(user)

  return 'OK'
})
