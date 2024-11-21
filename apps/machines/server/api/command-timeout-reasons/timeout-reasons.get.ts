import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async () => {
  const timeoutReasons = await knex('BFCOMMANDTIMEOUTREASONS').select(
    { id: 'ID', reasonText: 'REASONTEXT' },
  )

  return timeoutReasons
})
