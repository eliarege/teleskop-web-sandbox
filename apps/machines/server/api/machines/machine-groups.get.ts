import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const machineGroups: string[] = await knex('BFMACHGROUP').select({
      groupName: 'GROUPNAME',
      groupId: 'GROUPID',
      groupType: 'GROUPTYPE',
    })
    return machineGroups
  } catch (e) {
    return e
  }
})
