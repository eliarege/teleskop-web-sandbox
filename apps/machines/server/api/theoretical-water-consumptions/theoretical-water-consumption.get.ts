import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId, commandNo } = getQuery(event)
    return await knex('BFTHEORETICALWATERCONSUMPTION')
      .where('BFTHEORETICALWATERCONSUMPTION.MACHINEID', machineId)
      .andWhere('BFTHEORETICALWATERCONSUMPTION.COMMANDNO', commandNo)
      .select({
        commandIO: 'COMMANDIO',
        commandIO2: 'COMMANDIO2',
        commandParameter: 'COMMANDPRM',
      })
  } catch (e) {
    return e
  }
})
