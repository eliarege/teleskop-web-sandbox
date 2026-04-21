import { dmExchangeKnex, knex } from '~/server/connectionPool'
import { syncMachineGroupsWithDmExchange, syncMachinesWithDmExchange } from '~/server/lib/dmexchange'

export default defineNitroPlugin(async () => {
  if (!dmExchangeKnex)
    return
  try {
    console.log('Synchronizing machines with DM Exchange...')
    await syncMachineGroupsWithDmExchange(knex, dmExchangeKnex)
    await syncMachinesWithDmExchange(knex, dmExchangeKnex)
    console.log('DM Exchange synchronization completed.')
  } catch (err) {
    console.error('Error synchronizing with DM Exchange:', err)
  }
})
