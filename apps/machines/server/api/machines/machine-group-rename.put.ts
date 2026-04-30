import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { id, groupName } = await readBody(event)

  const existingGroup = await knex('BFMACHGROUP')
    .where('GROUPNAME', groupName)
    .whereNot('GROUPID', id)
    .first()

  if (existingGroup) {
    throw createError({
      statusCode: 409,
      statusMessage: 'GROUP_ALREADY_EXISTS',
    })
  }

  const result = await knex('BFMACHGROUP')
    .where('GROUPID', id)
    .update('GROUPNAME', groupName)

  return {
    success: true,
    message: 'GROUP_UPDATED_SUCCESSFULLY',
    updatedCount: result,
  }
})
