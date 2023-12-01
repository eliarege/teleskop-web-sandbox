import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const machineList = knex('dbo.BFMACHINES as b')
    .leftJoin('dbo.BFMACHGROUP as c', 'c.GROUPID', 'b.GRUPNO')
    .select({
      id: 'b.MACHINEID',
	    groupNo: 'b.GRUPNO',
	    groupName: 'c.GROUPNAME',
	    name: 'b.MACHINECODE',
	    machineCapacity: 'b.MACHINECAPACITY',
    })
    .where('b.INUSE', '=', 1)
  return (await machineList).map((machine) => {
    return {
      ...machine,
      isLocked: false,
      // eventColor: 'blue',
    }
  })
})
