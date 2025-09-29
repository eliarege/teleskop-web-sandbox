import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { paramId, groupId, commandNo, parameterIndex } = await readBody(event)

  const existing = await knex('BFTREATMENTPARAMGROUPMAP')
    .where({
      PARAMID: paramId,
      GROUPID: groupId,
    }).first()

  if (existing) {
    const result = await knex('BFTREATMENTPARAMGROUPMAP')
      .where({
        PARAMID: paramId,
        GROUPID: groupId,
      })
      .update({
        COMMANDNO: commandNo,
        PARAMETERINDEX: parameterIndex,
      })

    return {
      success: true,
      message: 'TREATMENT_MAP_UPDATED_SUCCESSFULLY',
      updatedCount: result,
    }
  } else {
    const result = await knex('BFTREATMENTPARAMGROUPMAP')
      .insert({
        PARAMID: paramId,
        GROUPID: groupId,
        COMMANDNO: commandNo,
        PARAMETERINDEX: parameterIndex,
      })

    return {
      success: true,
      message: 'TREATMENT_MAP_CREATED_SUCCESSFULLY',
      insertedId: result[0],
    }
  }
})
