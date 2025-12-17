import { knex } from '~/server/connectionPool'
import { MSSQL_ERROR, isSQLError } from '~/server/lib/error'

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
    if (isSQLError(error, MSSQL_ERROR.PRIMARY_KEY_VIOLATION)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'DUPLICATE_ENTRY',
      })
    }

    if (isSQLError(error, MSSQL_ERROR.FOREIGN_KEY_VIOLATION)) {
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
    })
  }
})
