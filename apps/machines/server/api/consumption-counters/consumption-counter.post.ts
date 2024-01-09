import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { machineId, counterId1, counterId2 } = await readBody(event)

    return await knex('BFCONSUMPTIONCOUNTERS')
      .where('MACHINEID', machineId)
      .update({
        COUNTER1: counterId1,
        COUNTER2: counterId2,
      })

})
