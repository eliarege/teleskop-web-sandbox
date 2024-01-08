import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {

    const machineGroups: string[] = await knex('BFMACHGROUP').select({
      groupName: 'GROUPNAME',
      groupId: 'GROUPID',
      groupType: 'GROUPTYPE',
    })
    return machineGroups

})
