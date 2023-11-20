import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = await getQuery(event)
    return await knex('BFMACHAOUT').where('MACHINEID', machineId).select({
      id: 'ID',
      name: 'NAME',
    })
  } catch (e) {
    return e
  }
})
