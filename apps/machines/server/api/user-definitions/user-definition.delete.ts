import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { userIds } = await readBody(event)
    const res = await knex('BFUSERS').whereIn('userID', userIds).del()
    return res

})
