import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { groupName } = await readBody(event)
  return await knex('BFTREATMENTPARAMETERGROUPS')
    .insert({
      GROUPNAME: groupName,
    })
})
