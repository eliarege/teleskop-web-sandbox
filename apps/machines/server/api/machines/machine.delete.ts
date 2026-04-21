import { dmExchangeKnex, knex } from '~/server/connectionPool'
import { deleteMachinesFromDmExchange } from '~/server/lib/dmexchange'

export default defineAuthEventHandler(async (event) => {
  const { machineIds } = await readBody(event)
  const res = await knex('BFMACHINES').whereIn('MACHINEID', machineIds).del()
  if (dmExchangeKnex)
    await deleteMachinesFromDmExchange(dmExchangeKnex, machineIds)
  return res
})
