import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  return await knex('BFCOMMANDTYPES')
    .where({
      machineId,
    })
    .leftJoin('BFMASTERCOMMANDS', function () {
      this
        .on('BFMASTERCOMMANDS.COMMANDNO', 'BFCOMMANDTYPES.commandNo')
        .andOn('BFMASTERCOMMANDS.MACHINEID', 'BFCOMMANDTYPES.machineId')
    })
    .select({
      machineId: 'machineId',
      commandType: 'BFCOMMANDTYPES.commandType',
      commandNo: 'BFCOMMANDTYPES.commandNo',
      commandName: 'BFMASTERCOMMANDS.NAME',
    })
})
