import { knex } from '~/server/connectionPool'
import { deleteMachinesFromDmExchange } from '~/server/lib/dmexchange'

export default defineAuthEventHandler(async (event) => {
  const { machineIds } = await readBody(event)
  const res = await knex.transaction(async (trx) => {
    const deleteResult = await trx('BFMACHINES').whereIn('MACHINEID', machineIds).del()
    await deleteMachinesFromDmExchange(machineIds)
    return deleteResult
  })
  return res
})
