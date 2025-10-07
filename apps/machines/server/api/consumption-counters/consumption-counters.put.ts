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
      if (!counter.machineId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'MACHINE_ID_REQUIRED',
        })
      }
    }

    await knex.transaction(async (trx) => {
      const upsertPromises = changedCounters.map(async (counter) => {
        const { machineId, counterId1, counterId2 } = counter

        return trx.raw(`
          INSERT INTO BFCONSUMPTIONCOUNTERS (MACHINEID, COUNTER1, COUNTER2)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            COUNTER1 = VALUES(COUNTER1),
            COUNTER2 = VALUES(COUNTER2)
        `, [
          machineId,
          counterId1 === -1 ? null : counterId1,
          counterId2 === -1 ? null : counterId2,
        ])
      })

      await Promise.all(upsertPromises)
    })

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
