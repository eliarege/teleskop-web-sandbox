import { dmsDB } from '~/server/connectionPool'
import type { MachineGroup } from '~/shared/types'

export default defineEventHandler(async () => {
  const machineGroups: Array<MachineGroup> = await dmsDB('PARAMETER_GROUP')
  .select({
    groupId: 'group_id',
    groupName: 'group_name'
  })
  return machineGroups
})
