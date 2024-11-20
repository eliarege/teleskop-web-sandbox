import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { reasonIds } = await readBody(event)
  const res = await knex('BFSTEPSKIPPINGREASONS')
    .whereIn('ID', reasonIds)
    .del()
  return res
})
