import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { reasonText, id } = await readBody(event)

    if (!reasonText || reasonText.trim() === '' || !id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MISSING_REQUIRED_FIELDS',
      })
    }

    // Check if reason already exists (excluding current record)
    const existingReason = await knex('BFCOMMANDTIMEOUTREASONS')
      .where('REASONTEXT', reasonText.trim())
      .where('ISDELETED', 0)
      .whereNot('ID', id)
      .first()

    if (existingReason) {
      throw createError({
        statusCode: 409,
        statusMessage: 'REASON_ALREADY_EXISTS',
      })
    }

    const res = await knex('BFCOMMANDTIMEOUTREASONS')
      .where('ID', id)
      .update({
        REASONTEXT: reasonText.trim(),
      })

    if (res === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'RECORD_NOT_FOUND',
      })
    }

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'UPDATE_OPERATION_FAILED',
    })
  }
})
