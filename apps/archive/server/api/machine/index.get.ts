import { db } from '~/server/database'

export default defineEventHandler(async () => {
  const machines = await db('BFMACHINES')
    .select({
      machineName: 'MACHINECODE',
      machineId: 'MACHINEID',
    })
    // .where('INUSE', true)
    .orderBy('MACHINEID')
  return machines
})
