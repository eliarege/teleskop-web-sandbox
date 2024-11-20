import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const commands = await knex('BFMASTERCOMMANDS')
    .where('MACHINEID', machineId)
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
