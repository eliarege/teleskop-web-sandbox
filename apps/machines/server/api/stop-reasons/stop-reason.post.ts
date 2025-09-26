import { knex } from '~/server/connectionPool'

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
    if (error?.code === 'ERR_DUP_ENTRY' || error?.message?.includes('PRIMARY KEY constraint')) {
      throw createError({
        statusCode: 409,
        statusMessage: 'ID_INUSE',
      })
    }

    if (error?.code === 'ERR_NO_REFERENCED_ROW' || error?.message?.includes('FOREIGN KEY constraint failed')) {
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
