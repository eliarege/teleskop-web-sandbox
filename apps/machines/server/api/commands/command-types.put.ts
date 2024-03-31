import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, commandTypes } = await readBody(event)

  await knex.transaction(async (trx) => {
    await trx('BFCOMMANDTYPES')
      .where('machineId', machineId)
      .del()

if (commandTypes?.length) {
    await trx('BFCOMMANDTYPES')
      .insert(commandTypes.map(commandType => ({
        machineId: commandType.machineId,
        commandNo: commandType.commandNo,
        commandType: commandType.commandType,
      })))
  })
}

  return commandTypes
})
