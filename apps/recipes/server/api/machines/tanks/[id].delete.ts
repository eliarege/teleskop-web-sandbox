import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { tankNo } = getQuery(event)

  try {
    const deletedRows = await dmsDB('TANK')
      .where({ machine_id: id, tank_no: tankNo })
      .del()

    if (!deletedRows) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tank not found',
      })
    }

    return { message: 'Tank deleted successfully' }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error deleting tank',
      data: error.message,
    })
  }
})
