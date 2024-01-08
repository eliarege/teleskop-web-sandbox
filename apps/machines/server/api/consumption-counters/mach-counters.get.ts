import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  return await knex('BFMACHCOUNTER')
    .select({
      id: 'ID',
      name: 'NAME',
    })
    .where('MACHINEID', machineId)
})
