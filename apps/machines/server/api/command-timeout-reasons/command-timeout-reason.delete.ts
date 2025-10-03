import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { id } = await readBody(event)

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MISSING_REQUIRED_FIELDS',
      })
    }

    const res = await knex('BFCOMMANDTIMEOUTREASONS')
      .where('ID', id).del()

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
      statusMessage: 'DELETE_OPERATION_FAILED',
    })
  }
})
