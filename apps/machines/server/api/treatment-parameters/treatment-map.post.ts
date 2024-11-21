import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { paramId, groupId, commandNo, parameterIndex } = await readBody(event)

  const existing = await knex('BFTREATMENTPARAMGROUPMAP')
    .where({
      PARAMID: paramId,
      GROUPID: groupId,
    }).first()

  if (existing) {
    return await knex('BFTREATMENTPARAMGROUPMAP')
      .where({
        PARAMID: paramId,
        GROUPID: groupId,
      })
      .update({
        COMMANDNO: commandNo,
        PARAMETERINDEX: parameterIndex,
      })
  } else {
    return await knex('BFTREATMENTPARAMGROUPMAP')
      .insert({
        PARAMID: paramId,
        GROUPID: groupId,
        COMMANDNO: commandNo,
        PARAMETERINDEX: parameterIndex,
      })
  }
})
