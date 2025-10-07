import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)

    if (!machineId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MACHINE_ID_REQUIRED',
      })
    }

    const result = await knex('BFCONSUMPTIONCOUNTERS')
      .select({
        counter1: 'COUNTER1',
        counter2: 'COUNTER2',
      })
      .where('MACHINEID', machineId).first()

    return result || { counter1: null, counter2: null }
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
