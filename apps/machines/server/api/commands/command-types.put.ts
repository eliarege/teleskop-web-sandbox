import { knex } from '~/server/connectionPool'
import type { CommandType } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const { machineId, commandTypes } = await readBody(event)

  await knex.transaction(async (trx) => {
    await trx('BFCOMMANDTYPES')
      .where('machineId', machineId)
      .del()

    if (commandTypes?.length) {
      await trx('BFCOMMANDTYPES')
        .insert(commandTypes.map((commandType: CommandType) => ({
          machineId: commandType.machineId,
          commandNo: commandType.commandNo,
          commandType: commandType.commandType,
        })))
    }
  })

  return commandTypes
})
