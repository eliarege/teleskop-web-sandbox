import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineAuthEventHandler(async () => {
  const machines: Machine[] = await knex('BFMACHINES')
    .select({
      machineId: 'MACHINEID',
      name: 'MACHINECODE',
      theoreticalSteam: 'THEORETICALSTEAM',
    })

  return machines
})
