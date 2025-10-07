import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { groupName } = await readBody(event)

  const existingGroup = await knex('BFTREATMENTPARAMETERGROUPS')
    .where('GROUPNAME', groupName)
    .first()

  if (existingGroup) {
    throw createError({
      statusCode: 409,
      statusMessage: 'GROUP_ALREADY_EXISTS',
    })
  }

  const result = await knex('BFTREATMENTPARAMETERGROUPS')
    .insert({
      GROUPNAME: groupName,
    })

  return {
    success: true,
    message: 'GROUP_CREATED_SUCCESSFULLY',
    insertedId: result[0],
  }
})
