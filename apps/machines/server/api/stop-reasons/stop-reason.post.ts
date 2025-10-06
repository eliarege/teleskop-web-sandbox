import { knex } from '~/server/connectionPool'
import { isSQLError } from '~/server/utils/error'

export default defineAuthEventHandler(async (event) => {
  try {
    const { stopCode, stopName, reportToERP } = await readBody(event)

    if (!stopCode || !stopName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'BAD_REQUEST',
      })
    }

    const res = await knex('BFSTOPREASONS')
      .insert({
        STOPCODE: stopCode,
        STOPNAME: stopName,
        ReportToERP: reportToERP,
      })

    return res
  } catch (error: any) {
    if (isSQLError(error, 2627) || isSQLError(error, 2601)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'ID_INUSE',
      })
    }

    if (isSQLError(error, 547)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'BAD_REQUEST',
      })
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Database error in stop-reason POST:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
