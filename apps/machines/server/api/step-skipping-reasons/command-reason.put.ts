import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { changedCommands } = await readBody(event)

  for (const { command, checked } of changedCommands) {
    checked
      ? await knex('BFSTEPSKIPPINGREASONCOMMANDS').insert({
        MACHINEID: command.machineId,
        COMMANDNO: command.commandNo,
      })
      : await knex('BFSTEPSKIPPINGREASONCOMMANDS').where({
        MACHINEID: command.machineId,
        COMMANDNO: command.commandNo,
      }).del()
  }
})
