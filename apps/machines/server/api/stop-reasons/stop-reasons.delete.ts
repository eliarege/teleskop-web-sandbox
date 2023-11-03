import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { stopCodes } = await readBody(event)
    const res = await knex('BFSTOPREASONS').whereIn('STOPCODE', stopCodes).del()
    return res
  } catch (e) {
    return e
  }
})
