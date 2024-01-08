import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { machineId } = getQuery(event)
    return await knex('BFMACHDOUT').where('MACHINEID', machineId).select({
      id: 'ID',
      name: 'NAME',
    })

})
