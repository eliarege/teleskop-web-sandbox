import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineIds } = await readBody(event)

  const res = await knex('BFMACHINES')
    .whereIn('MACHINEID', machineIds)
    .del()
  return res
})
