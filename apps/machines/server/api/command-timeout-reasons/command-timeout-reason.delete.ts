import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event)

  const res = await knex('BFCOMMANDTIMEOUTREASONS')
    .where('ID', id).del()

  return res
})
