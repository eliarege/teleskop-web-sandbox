import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId, commandNo } = getQuery(event)
    return await knex('BFTHEORETICALWATERCONSUMPTION')
      .leftJoin('BFCOMMANDINPUTOUTPUTS', function () {
        this
          .on('BFTHEORETICALWATERCONSUMPTION.COMMANDNO', 'BFCOMMANDINPUTOUTPUTS.COMMANDNO')
          .andOn('BFTHEORETICALWATERCONSUMPTION.MACHINEID', 'BFCOMMANDINPUTOUTPUTS.MACHINEID')
      })
      .where('BFTHEORETICALWATERCONSUMPTION.MACHINEID', machineId)
      .andWhere('BFTHEORETICALWATERCONSUMPTION.COMMANDNO', commandNo)
      .select({
        commandIO: 'COMMANDIO',
        commandIO2: 'COMMANDIO2',
        commandParameter: 'COMMANDPRM',
        name: 'NAME',
        ioType: 'IOTYPE',
      })
  } catch (e) {
    return e
  }
})
