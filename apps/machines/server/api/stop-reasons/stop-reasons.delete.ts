import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { stopCodes } = await readBody(event)
  const res = await knex('BFSTOPREASONS').whereIn('STOPCODE', stopCodes).del()
  return res
})
