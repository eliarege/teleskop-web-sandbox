import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  return await knex('BFTREATMENTPARAMETERGROUPS')
    .select({
      id: 'ID',
      groupName: 'GROUPNAME',
      temperatureControlCommand: 'TEMPERATURECONTROLCOMMAND',
    })
})
