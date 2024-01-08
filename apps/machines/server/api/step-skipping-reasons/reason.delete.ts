import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { reasonId } = await readBody(event)

  const res = await knex('BFSTEPSKIPPINGREASONS')
    .where('ID', reasonId).del()

  return res
})
