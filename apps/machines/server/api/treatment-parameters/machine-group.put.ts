import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { id, groupName } = await readBody(event)
  return await knex('BFTREATMENTPARAMETERGROUPS')
    .where('ID', id)
    .update('GROUPNAME', groupName)
})
