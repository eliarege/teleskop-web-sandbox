import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const machines = await knex('BFMACHINES')
      .where({
        USEINTELESKOP: false,
        GRUPNO: -1,
      })
      .select({
        machineId: 'MACHINEID',
        machineName: 'MACHINECODE',
        inUse: 'INUSE',
      },
      )
      .orderBy('MACHINEID')
    return machines
  } catch (e) {
    return e
  }
})
