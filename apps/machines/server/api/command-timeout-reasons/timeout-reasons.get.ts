import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async () => {
  try {
    const timeoutReasons = await knex('BFCOMMANDTIMEOUTREASONS')
      .where('ISDELETED', 0)
      .select(
        { id: 'ID', reasonText: 'REASONTEXT' },
      )
      .orderBy('REASONTEXT')

    return timeoutReasons
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'FETCH_TIMEOUT_REASONS_FAILED',
    })
  }
})
