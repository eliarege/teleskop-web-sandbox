import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, commandNo } = getQuery(event)
  return await knex('BFTHEORETICALWATERCONSUMPTION')
    .where('BFTHEORETICALWATERCONSUMPTION.MACHINEID', machineId)
    .andWhere('BFTHEORETICALWATERCONSUMPTION.COMMANDNO', commandNo)
    .select({
      commandIO: 'COMMANDIO',
      commandIO2: 'COMMANDIO2',
      commandParameter: 'COMMANDPRM',
    })
})
