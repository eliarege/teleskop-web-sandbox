import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { stopCodes } = await readBody(event)

    // Validation
    if (!stopCodes || !Array.isArray(stopCodes) || stopCodes.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'BAD_REQUEST',
      })
    }

    const res = await knex('BFSTOPREASONS').whereIn('STOPCODE', stopCodes).del()

    if (res === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'NOT_FOUND',
      })
    }

    return res
  } catch (error: any) {
    if (error?.code === 'ERR_ROW_IS_REFERENCED' || error?.message?.includes('FOREIGN KEY constraint failed')) {
      throw createError({
        statusCode: 409,
        statusMessage: 'CONFLICT',
      })
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Database error in stop-reasons DELETE:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
