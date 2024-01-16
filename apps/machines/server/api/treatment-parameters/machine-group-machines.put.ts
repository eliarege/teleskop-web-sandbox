import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, groupId, action } = await readBody(event)

  if (action === 'add') {
    return await knex('BFTREATMENTPARAMETERGROUPMACHINES')
      .insert({
        MACHINEID: machineId,
        GROUPID: groupId,
      })
  } else if (action === 'remove') {
    return await knex('BFTREATMENTPARAMETERGROUPMACHINES')
      .where({
        MACHINEID: machineId,
        GROUPID: groupId,
      }).del()
  }
})
