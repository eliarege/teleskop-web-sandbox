import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async () => {
  const machineGroups = await knex('BFMACHGROUP').select({
    groupName: 'GROUPNAME',
    groupId: 'GROUPID',
    groupType: 'GROUPTYPE',
  }) as {
    groupId: number
    groupName: string
    groupType: number
  }[]
  return machineGroups
})
