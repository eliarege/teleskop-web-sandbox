import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { filters } = await readBody(event)

    const selectParams = {
      userId: 'userID',
      userName: 'userName',
      userSurname: 'userSurname',
      userPass: 'userPass',
      userInfo: 'userInfo',
      userActive: 'userActive',
      userType: 'userType',
    }

    const query = knex('BFUSERS')
      .select(selectParams)
      .orderBy('userID')

    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query

})
