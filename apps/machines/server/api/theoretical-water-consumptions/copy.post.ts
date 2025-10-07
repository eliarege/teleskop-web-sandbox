import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { sourceMachineId, targetMachineId } = await readBody(event)

  await knex.transaction(async (trx) => {
    const records = await trx('BFTHEORETICALWATERCONSUMPTION')
      .where('MACHINEID', sourceMachineId)

    await trx('BFTHEORETICALWATERCONSUMPTION')
      .where('MACHINEID', targetMachineId)
      .del()

    if (records.length > 0) {
      await trx('BFTHEORETICALWATERCONSUMPTION')
        .insert(records.map(w => ({
          ...w,
          MACHINEID: targetMachineId,
        })))
    }
  })
})
