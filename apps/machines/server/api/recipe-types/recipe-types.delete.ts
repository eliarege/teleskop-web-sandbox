import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { ids } = await readBody(event)
  const res = await knex('BFRECIPETYPES').whereIn('ID', ids).del()
  return res
})
