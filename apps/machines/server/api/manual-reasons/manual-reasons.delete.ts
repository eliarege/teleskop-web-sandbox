import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { manualIds } = await readBody(event)
  const res = await knex('BFMANUALREASONSGENERAL').whereIn('manualID', manualIds).del()
  return res
})
