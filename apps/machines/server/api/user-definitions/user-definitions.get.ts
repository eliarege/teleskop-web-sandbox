import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const machines = await knex('BFUSERS')
      .select({
        userId: 'userID',
        userName: 'userName',
        userSurname: 'userSurname',
        userPass: 'userPass',
        userInfo: 'userInfo',
        userActive: 'userActive',
        userType: 'userType',
      },
      )
      .orderBy('userID')
    return machines
  } catch (e) {
    return e
  }
})
