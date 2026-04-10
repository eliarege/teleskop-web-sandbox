import { isDmExchangeEnabled, knex } from '~/server/connectionPool'
import { syncMachinesWithDmExchange } from '~/server/lib/dmexchange'

export default defineNitroPlugin(async () => {
  if (!isDmExchangeEnabled) return
  try {
    console.log('Synchronizing machines with DM Exchange...')
    await syncMachinesWithDmExchange(knex)
    console.log('DM Exchange synchronization completed.')
  } catch (err) {
    console.error('Error synchronizing with DM Exchange:', err)
  }
})
