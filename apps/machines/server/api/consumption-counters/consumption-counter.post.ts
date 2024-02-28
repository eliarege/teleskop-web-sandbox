import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, counterId1, counterId2 } = await readBody(event)

  const existingRecord = await knex('BFCONSUMPTIONCOUNTERS')
    .where('MACHINEID', machineId)
    .first()

  if (existingRecord) {
    await knex('BFCONSUMPTIONCOUNTERS')
      .where('MACHINEID', machineId)
      .update({
        COUNTER1: counterId1,
        COUNTER2: counterId2,
      })
  } else {
    await knex('BFCONSUMPTIONCOUNTERS').insert({
      MACHINEID: machineId,
      COUNTER1: counterId1,
      COUNTER2: counterId2,
    })
  }
})
