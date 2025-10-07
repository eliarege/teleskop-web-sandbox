import { knex } from '~/server/connectionPool'
import { MSSQL_ERROR, isSQLError } from '~/server/utils/error'

export default defineAuthEventHandler(async (event) => {
  try {
    const { stopCode, stopName, reportToERP, originalStopCode } = await readBody(event)

    if (!stopCode || !stopName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'BAD_REQUEST',
      })
    }

    const searchStopCode = originalStopCode || stopCode

    const existingRecord = await knex('BFSTOPREASONS').where('STOPCODE', searchStopCode).first()
    if (!existingRecord) {
      throw createError({
        statusCode: 404,
        statusMessage: 'NOT_FOUND',
      })
    }

    const res = await knex('BFSTOPREASONS').where('STOPCODE', searchStopCode)
      .update({
        STOPCODE: stopCode,
        STOPNAME: stopName,
        ReportToERP: reportToERP,
      })

    return res
  } catch (error: any) {
    if (isSQLError(error, MSSQL_ERROR.PRIMARY_KEY_VIOLATION)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Duplicate entry',
      })
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Database error in stop-reason PUT:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
