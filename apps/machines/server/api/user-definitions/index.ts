import { knex } from '~/server/connectionPool'
import type { User } from '~/types'

export default defineAuthEventHandler(async (event) => {
  if (event.method === 'GET') {
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
  }

  if (event.method === 'POST') {
    const body: User = await readBody(event)

    const exists = await knex('BFUSERS')
      .where('userID', body.userId)
      .first()

    if (exists) {
      throw createError({
        statusCode: 400,
        statusMessage: `UserID ${body.userId} zaten mevcut!`,
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
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
