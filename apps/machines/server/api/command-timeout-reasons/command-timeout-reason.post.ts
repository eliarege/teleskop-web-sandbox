import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { reasonText } = await readBody(event)

    if (!reasonText || reasonText.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'REASON_TEXT_REQUIRED',
      })
    }

    // Check if reason already exists
    const existingReason = await knex('BFCOMMANDTIMEOUTREASONS')
      .where('REASONTEXT', reasonText.trim())
      .where('ISDELETED', 0)
      .first()

    if (existingReason) {
      throw createError({
        statusCode: 409,
        statusMessage: 'REASON_ALREADY_EXISTS',
      })
    }

    const res = await knex('BFCOMMANDTIMEOUTREASONS').insert({
      GROUPID: 1,
      REASONTEXT: reasonText.trim(),
      ISDELETED: 0,
    })

    return { success: true, id: res[0] }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'CREATE_OPERATION_FAILED',
    })
  }
})
