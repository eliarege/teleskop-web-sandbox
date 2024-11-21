import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { id } = await readBody(event)

  const res = await knex('BFCOMMANDTIMEOUTREASONS')
    .where('ID', id).del()

  return res
})
