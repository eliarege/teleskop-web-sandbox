import { userUpdateSchema } from '~/schemas/user.schema'
import { knex } from '~/server/connectionPool'
import type { User } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const { user_id } = getRouterParams(event)

  if (event.method === 'GET') {
    const user = await knex('BFUSERS')
      .select({
        userId: 'userID',
        userName: 'userName',
        userSurname: 'userSurname',
        userPass: 'userPass',
        userMode: 'userMode',
        userInfo: 'userInfo',
        userActive: 'userActive',
        userDeleted: 'userDeleted',
        userMode2: 'userMode2',
        userType: 'userType',
      })
      .where('userID', user_id)
      .first()

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    return user
  }

  if (event.method === 'PUT') {
    const body: User = await readBody(event)

    const parsed = userUpdateSchema.safeParse(body)
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: parsed.error.format(),
      })
    }

    await knex('BFUSERS')
      .update(parsed.data)
      .where('userID', user_id)

    return { success: true }
  }

  if (event.method === 'DELETE') {
    await knex('BFUSERS')
      .where('userID', user_id)
      .del()

    return { success: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
