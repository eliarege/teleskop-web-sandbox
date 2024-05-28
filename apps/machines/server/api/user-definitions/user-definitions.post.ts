import { filtersToKnex } from 'utils'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters } = await readBody(event)

  const selectParams = {
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
  }

  const query = knex('BFUSERS')
    .select(selectParams)
    .orderBy('userID')

  if (filters)
    return await filtersToKnex(filters, selectParams, query)

  return await query
})
