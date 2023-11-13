import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const timeoutReasons = await knex('BFCOMMANDTIMEOUTREASONS').select(
      { id: 'ID', reasonText: 'REASONTEXT' },
    )

    return timeoutReasons
  } catch (e) {
    return e
  }
})
