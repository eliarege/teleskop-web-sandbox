import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { id } = await readBody(event)

  const existingGroup = await knex('BFTREATMENTPARAMETERGROUPS')
    .where('ID', id)
    .first()

  if (!existingGroup) {
    throw createError({
      statusCode: 404,
      statusMessage: 'GROUP_NOT_FOUND',
    })
  }

  const result = await knex('BFTREATMENTPARAMETERGROUPS')
    .where('ID', id)
    .del()

  return {
    success: true,
    message: 'GROUP_DELETED_SUCCESSFULLY',
    deletedCount: result,
  }
})
