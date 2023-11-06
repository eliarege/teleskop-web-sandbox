import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const unplannedEvents = knex('dbo.PTBATCHPLANQUEUE as p')
    .leftJoin('dbo.DYBFBATCHPLAN as d', 'd.PLANKEY', 'p.PLANKEY')
    .select({
      id: 'p.PLANKEY',
      machineId: 'p.MACHINEID',
      queueNumber: 'p.QUEUENUMBER',
      name: 'd.JOBORDER',
      fabricWeight: 'd.FABRICWEIGHT',
      theoricalDuration: 'd.TheoricalDuration',
    })
    .orderBy([
      {
        column: 'p.MACHINEID',
        order: 'asc',
      },
      {
        column: 'p.QUEUENUMBER',
        order: 'asc',
      },
    ])
  return unplannedEvents
})
