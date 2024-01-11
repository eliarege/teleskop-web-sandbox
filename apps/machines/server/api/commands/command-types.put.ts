import { knex } from '~/server/connectionPool'
import type { CommandTypeEvent } from '~/types'

export default defineEventHandler(async (event) => {
  const commandTypeEvent: CommandTypeEvent = await readBody(event)
  const { machineId, commandNo, commandType, action } = commandTypeEvent

  if (action === 'add') {
    return await knex('BFCOMMANDTYPES')
      .insert({
        machineId,
        commandNo,
        commandType,
      })
  } else if (action === 'remove') {
    return await knex('BFCOMMANDTYPES')
      .where({
        machineId,
        commandNo,
      }).del()
  }
})
