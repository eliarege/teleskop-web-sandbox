import { knex } from '~/server/connectionPool'
import type { User } from '~/types'

export default defineAuthEventHandler(async (event) => {
  if (event.method === 'GET') {
    try {
      return await knex('BFUSERS')
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
        .orderBy('userID')
    } catch (error) {
      console.error('Error fetching users:', error)
      throw createError({
        statusCode: 500,
      })
    }
  }

  if (event.method === 'POST') {
    const body: User = await readBody(event)

    try {
      const exists = await knex('BFUSERS')
        .where('userID', body.userId)
        .first()

      if (exists) {
        throw createError({
          statusCode: 400,
          statusMessage: `USER_ALREADY_EXISTS`,
        })
      }

      await knex('BFUSERS').insert({
        userID: body.userId,
        userName: body.userName,
        userSurname: body.userSurname,
        userPass: body.userPass,
        userMode: body.userMode,
        userInfo: body.userInfo,
        userActive: body.userActive ?? 1,
        userDeleted: 0,
        userMode2: body.userMode2,
        userType: body.userType,
      })

      return { userId: body.userId }
    } catch (error) {
      console.error('Error creating user:', error)
      throw createError({
        statusCode: 500,
      })
    }
  }

  if (event.method === 'DELETE') {
    const body: { userIds: number[] } = await readBody(event)
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No user IDs provided for deletion.',
      })
    }

    await knex('BFUSERS')
      .whereIn('userID', userIds)
      .del()

    return { deletedUserIds: userIds }
  }

  throw createError({ statusCode: 405, statusMessage: 'METHOD_NOT_ALLOWED' })
})
