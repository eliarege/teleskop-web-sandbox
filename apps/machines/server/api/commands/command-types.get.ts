import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  return await knex('BFCOMMANDTYPES')
    .where({
      machineId,
      MACHINEID: machineId,
    })
    .leftJoin('BFMASTERCOMMANDS', 'BFMASTERCOMMANDS.COMMANDNO', 'BFCOMMANDTYPES.commandNo')
    .select({
      machineId: 'machineId',
      commandType: 'BFCOMMANDTYPES.commandType',
      commandNo: 'BFCOMMANDTYPES.commandNo',
      commandName: 'BFMASTERCOMMANDS.NAME',
    })
})
