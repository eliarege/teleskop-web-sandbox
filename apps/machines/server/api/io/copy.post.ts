import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { sourceMachineId, targetMachineId } = await readBody(event)

  await knex.transaction(async (trx) => {
    for (const table of ['BFMACHAIN', 'BFMACHAOUT']) {
      const records = await trx(table)
        .where('MACHINEID', sourceMachineId)

      await trx(table)
        .where('MACHINEID', targetMachineId)
        .del()

      await trx(table)
        .insert(records.map(r => ({
          ...r,
          MACHINEID: targetMachineId,
        })))
    }
  })
})
