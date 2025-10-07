import { knex } from '~/server/connectionPool'
import { MSSQL_ERROR, isSQLError } from '~/server/utils/error'
import type { User } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const user: User = await readBody(event)

  const existingUser = await knex('BFUSERS')
    .where({ userID: user.userId })
    .first()

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'ID_INUSE',
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
    if (isSQLError(error, MSSQL_ERROR.PRIMARY_KEY_VIOLATION)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Duplicate entry',
      })
    }
    throw error
  }
})
