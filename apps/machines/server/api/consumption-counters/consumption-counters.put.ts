import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { changedCounters } = await readBody(event)

    if (!changedCounters || !Array.isArray(changedCounters)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'INVALID_REQ_BODY',
      })
    }

    for (const counter of changedCounters) {
      const { machineId, counterId1, counterId2 } = counter

      if (!machineId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'MACHINE_ID_REQUIRED',
        })
      }

      const existingRecord = await knex('BFCONSUMPTIONCOUNTERS')
        .where('MACHINEID', machineId)
        .first()

      if (existingRecord) {
        await knex('BFCONSUMPTIONCOUNTERS')
          .where('MACHINEID', machineId)
          .update({
            COUNTER1: counterId1 === -1 ? null : counterId1,
            COUNTER2: counterId2 === -1 ? null : counterId2,
          })
      } else {
        await knex('BFCONSUMPTIONCOUNTERS').insert({
          MACHINEID: machineId,
          COUNTER1: counterId1 === -1 ? null : counterId1,
          COUNTER2: counterId2 === -1 ? null : counterId2,
        })
      }
    }

    return { success: true, message: 'CONSUMPTION_COUNTERS_UPDATED' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_SERVER_ERROR',
    })
  }
})
