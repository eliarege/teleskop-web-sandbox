import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)
    const commandNumbers = await knex('BFCOMMANDTIMEOUTREASONMAP').where('MACHINEID', machineId).select('COMMANDNO')

    const commands = await knex('BFMASTERCOMMANDS').whereIn('COMMANDNO', commandNumbers.map(c => c.COMMANDNO))
      .andWhere('MACHINEID', machineId)
      .select(
        { commandNo: 'COMMANDNO', commandName: 'NAME' },
      )

    return commands
  } catch (e) {
    return e
  }
})
