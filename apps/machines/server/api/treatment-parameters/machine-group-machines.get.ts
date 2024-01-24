import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { groupId } = getQuery(event)
  return await knex('BFTREATMENTPARAMETERGROUPMACHINES')
    .leftJoin('BFMACHINES', 'BFMACHINES.MACHINEID', 'BFTREATMENTPARAMETERGROUPMACHINES.MACHINEID')
    .where('GROUPID', groupId)
    .select({
      machineId: 'BFTREATMENTPARAMETERGROUPMACHINES.MACHINEID',
      groupId: 'GROUPID',
      machineCode: 'MACHINECODE',
    })
})
