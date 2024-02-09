import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { paramId, groupId, commandNo, parameterIndex } = await readBody(event)

  return await knex('BFTREATMENTPARAMGROUPMAP')
    .insert({
      PARAMID: paramId,
      GROUPID: groupId,
      COMMANDNO: commandNo,
      PARAMETERINDEX: parameterIndex,
    })
})
