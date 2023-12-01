import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineEventHandler(async () => {
  try {
    const machines: Machine[] = await knex('BFMACHINES')
      .where({
        INUSE: 1,
        USEINTELESKOP: 1,
      })
      .select({
        machineId: 'MACHINEID',
        machineName: 'MACHINECODE',
      },
      )
      .orderBy('MACHINEID')
    return machines
  } catch (e) {
    return e
  }
})
