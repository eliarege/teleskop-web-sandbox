import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId, counterId1, counterId2 } = await readBody(event)
    console.log('machineId, counterId1, counterId2 = ', machineId, counterId1, counterId2)

    return await knex('BFCONSUMPTIONCOUNTERS')
      .where('MACHINEID', machineId)
      .update({
        COUNTER1: counterId1,
        COUNTER2: counterId2,
      })
  } catch (err) {
    console.log('err = ', err)
    return err
  }
})
