import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const commands = await tbb.fetchCommandsGeneral()

    const generalCommands = commands.map(command => ({
      ...command,
      machineId,
      activated: (command.activated === '1' && command.machineConstantId && command.machineConstantId !== -1) ? 1 : 0,
    }))

    await knex('BFMASTERCOMMANDS')
      .where('MACHINEID', machineId)
      .del()
    await knex('BFMASTERCOMMANDS').insert(generalCommands)

    return generalCommands
  } catch (err) {
    console.error(err)
  }
})
