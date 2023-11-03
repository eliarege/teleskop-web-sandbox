import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const user: User = await readBody(event)
    const res = await knex('BFUSERS').where({
      userID: user.userId,
    }).update({
      userName: user.userName,
      userSurname: user.userSurname,
      userPass: user.userPass,
      userInfo: user.userInfo,
      userActive: user.userActive,
      userType: user.userType,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
