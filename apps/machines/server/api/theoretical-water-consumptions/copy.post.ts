import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { sourceMachineId, targetMachineId } = await readBody(event)

  await knex.transaction(async (trx) => {
    const filteredWaters = await trx('BFTHEORETICALWATERCONSUMPTION')
      .where('MACHINEID', sourceMachineId)
      .whereIn('COMMANDNO', trx('BFTHEORETICALWATERCONSUMPTION')
        .where('MACHINEID', targetMachineId)
        .select('COMMANDNO'))

    await trx('BFTHEORETICALWATERCONSUMPTION')
      .where('MACHINEID', targetMachineId)
      .del()

    await trx('BFTHEORETICALWATERCONSUMPTION')
      .insert(filteredWaters.map(w => ({
        ...w,
        MACHINEID: targetMachineId,
      })))
  })
})
