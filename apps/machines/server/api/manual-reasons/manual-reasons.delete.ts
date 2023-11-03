import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { manualIds } = await readBody(event)
    const res = await knex('BFMANUALREASONSGENERAL').whereIn('manualID', manualIds).del()
    return res
  } catch (e) {
    return e
  }
})
