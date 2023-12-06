import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)
    return await knex('BFMACHAIN').where('MACHINEID', machineId).select({
      id: 'ID',
      name: 'NAME',
    })
  } catch (e) {
    return e
  }
})
