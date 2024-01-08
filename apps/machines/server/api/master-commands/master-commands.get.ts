import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { machineId } = getQuery(event)
    const commands = await knex('BFMASTERCOMMANDS')
      .where('MACHINEID', machineId)
      .select(
        { commandNo: 'COMMANDNO', commandName: 'NAME' },
      )

    return commands

})
