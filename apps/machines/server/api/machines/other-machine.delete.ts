import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineIds } = await readBody(event)

  const res = await knex('BFMACHINES')
    .whereIn('MACHINEID', machineIds)
    .del()
  return res
})
