import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  if (event.method === 'DELETE') {
    const body: { userIds: number[] } = await readBody(event)
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No user IDs provided for deletion.',
      })
    }

    await knex.transaction(async (trx) => {
      await trx('BFUSERS')
        .whereIn('userID', userIds)
        .del()
    })

    return { success: true, deletedUserIds: userIds }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
