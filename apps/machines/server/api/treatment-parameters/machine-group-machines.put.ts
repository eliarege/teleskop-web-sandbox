import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, groupId, action } = await readBody(event)

  if (action === 'add') {
    const existing = await knex('BFTREATMENTPARAMETERGROUPMACHINES')
      .where({
        MACHINEID: machineId,
        GROUPID: groupId,
      }).first()

    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: 'MACHINE_GROUP_MAPPING_ALREADY_EXISTS',
      })
    }

    const result = await knex('BFTREATMENTPARAMETERGROUPMACHINES')
      .insert({
        MACHINEID: machineId,
        GROUPID: groupId,
      })

    return {
      success: true,
      message: 'MACHINE_ADDED_TO_GROUP_SUCCESSFULLY',
      insertedId: result[0],
    }
  } else if (action === 'remove') {
    const existing = await knex('BFTREATMENTPARAMETERGROUPMACHINES')
      .where({
        MACHINEID: machineId,
        GROUPID: groupId,
      }).first()

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'MACHINE_GROUP_MAPPING_NOT_FOUND',
      })
    }

    const result = await knex('BFTREATMENTPARAMETERGROUPMACHINES')
      .where({
        MACHINEID: machineId,
        GROUPID: groupId,
      }).del()

    return {
      success: true,
      message: 'MACHINE_REMOVED_FROM_GROUP_SUCCESSFULLY',
      deletedCount: result,
    }
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: 'INVALID_ACTION',
    })
  }
})
