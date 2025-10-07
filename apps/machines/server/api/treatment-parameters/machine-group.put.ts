import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { id, groupName } = await readBody(event)

  const existingGroup = await knex('BFTREATMENTPARAMETERGROUPS')
    .where('GROUPNAME', groupName)
    .whereNot('ID', id)
    .first()

  if (existingGroup) {
    throw createError({
      statusCode: 409,
      statusMessage: 'GROUP_ALREADY_EXISTS',
    })
  }

  const result = await knex('BFTREATMENTPARAMETERGROUPS')
    .where('ID', id)
    .update('GROUPNAME', groupName)

  return {
    success: true,
    message: 'GROUP_UPDATED_SUCCESSFULLY',
    updatedCount: result,
  }
})
