import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineEventHandler(async () => {
  const machines: Machine[] = await knex('BFMACHINES')
    .where({
      INUSE: 1,
      USEINTELESKOP: 1,
    })
    .select({
      machineId: 'MACHINEID',
      machineCode: 'MACHINECODE',
    },
    )
    .orderBy('MACHINEID')
  return machines
})
