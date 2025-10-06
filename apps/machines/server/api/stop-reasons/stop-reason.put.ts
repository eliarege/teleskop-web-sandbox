import { knex } from '~/server/connectionPool'
import { isSQLError } from '~/server/utils/error'

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

    if (originalStopCode && originalStopCode !== stopCode) {
      const duplicateCheck = await knex('BFSTOPREASONS').where('STOPCODE', stopCode).first()
      if (duplicateCheck) {
        throw createError({
          statusCode: 409,
          statusMessage: 'ID_INUSE',
        })
      }
    }

    const res = await knex('BFSTOPREASONS').where('STOPCODE', searchStopCode)
      .update({
        STOPCODE: stopCode,
        STOPNAME: stopName,
        ReportToERP: reportToERP,
      })

    return res
  } catch (error: any) {
    console.log('error msg:', error.message)
    if (isSQLError(error, 2627) || isSQLError(error, 2601)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'ID_INUSE',
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
