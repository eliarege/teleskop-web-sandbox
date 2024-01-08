import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  return await knex('BFSMARTREQUESTCOMMANDS')
    .leftOuterJoin('BFMASTERCOMMANDS', function () {
      this
        .on('BFSMARTREQUESTCOMMANDS.COMMANDNO', 'BFMASTERCOMMANDS.COMMANDNO')
        .andOn('BFSMARTREQUESTCOMMANDS.MACHINEID', 'BFMASTERCOMMANDS.MACHINEID')
    })
    .where('BFSMARTREQUESTCOMMANDS.MACHINEID', machineId)
    .select({
      commandType: 'BFSMARTREQUESTCOMMANDS.COMMANDTYPE',
      commandNo: 'BFSMARTREQUESTCOMMANDS.COMMANDNO',
      commandName: 'NAME',
    })
})
