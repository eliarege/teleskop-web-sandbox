import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { sourceMachineId, targetMachineId } = await readBody(event)

  const filteredWaters = await knex('BFTHEORETICALWATERCONSUMPTION')
    .where('MACHINEID', sourceMachineId)
    .whereIn('COMMANDNO', knex('BFTHEORETICALWATERCONSUMPTION')
      .where('MACHINEID', targetMachineId)
      .select('COMMANDNO'))

  await knex('BFTHEORETICALWATERCONSUMPTION')
    .where('MACHINEID', targetMachineId)
    .del()

  await knex('BFTHEORETICALWATERCONSUMPTION')
    .insert(filteredWaters.map(w => ({
      ...w,
      MACHINEID: targetMachineId,
    })))
})
