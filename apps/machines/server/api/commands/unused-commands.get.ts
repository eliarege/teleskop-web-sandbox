import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  const usedCommands = await knex('BFCOMMANDTYPES')
    .where({
      machineId,
    })
    .select({
      commandType: 'BFCOMMANDTYPES.commandType',
      commandNo: 'BFCOMMANDTYPES.commandNo',
    })

  const commands = await knex('BFMASTERCOMMANDS')
    .where('MACHINEID', machineId)
    .whereNotIn('COMMANDNO', usedCommands.map(command => command.commandNo))
    .select(
      {
        machineId: 'MACHINEID',
        commandNo: 'COMMANDNO',
        functionId: 'FUNCTIONID',
        tbbFunctionName: 'TBBFUNTIONNAME',
        commandName: 'NAME',
        activated: 'ACTIVATED',
        adviceList: 'ADVICELIST',
        dontUseList: 'DONTUSELIST',
        isRunManual: 'ISRUNMANUAL',
        commandType: 'COMMANDTYPE',
        moveParallel: 'MOVEPARALLEL',
        changeTime: 'CHANGETIME',
        tbbChangeTime: 'TBBCHANGETIME',
        isDeleted: 'ISDELETED',
        isChanged: 'ISCHANGED',
        x: 'X',
        y: 'Y',
        a: 'A',
        b: 'B',
        maxA: 'MAXA',
        isTemperature: 'ISTEMPERATURE',
        isUnload: 'ISUNLOAD',
        icon: 'ICON',
        groupId: 'GROUPID',
      },
    )

  return commands
})
