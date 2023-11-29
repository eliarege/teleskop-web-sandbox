import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const machineIds = await knex('BFCOMMANDTIMEOUTREASONMAP').distinct(
      { machineId: 'MACHINEID' },
    )

    const machineNames = await knex('BFMACHINES').whereIn(
      'MACHINEID',
      machineIds.map(m => m.machineId),
    ).select({
      machineId: 'MACHINEID',
      machineName: 'MACHINECODE',
    })

    return machineNames
  } catch (e) {
    return e
  }
})
// inuse = 1 & useinteleskop = 1
