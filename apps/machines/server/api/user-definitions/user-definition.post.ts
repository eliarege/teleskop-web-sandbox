import { knex } from '~/server/connectionPool'
import type { User } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const user: User = await readBody(event)

  const existingUser = await knex('BFUSERS')
    .where({ userID: user.userId })
    .first()

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: `ID_INUSE`,
    })
  }

  try {
    const res = await knex('BFUSERS').insert({
      userID: user.userId,
      userName: user.userName,
      userSurname: user.userSurname,
      userPass: user.userPass,
      userInfo: user.userInfo,
      userActive: user.userActive,
      userType: user.userType,
    })
    return res
  } catch (error: any) {
    if (error.code === 'ERR_DUP_ENTRY' || error.message?.includes('PRIMARY KEY constraint')) {
      throw createError({
        statusCode: 409,
        statusMessage: `ID_INUSE`,
      })
    }
    throw error
  }
})
