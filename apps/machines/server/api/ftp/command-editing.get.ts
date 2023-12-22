import { TbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new TbbFtpClient('192.168.88.202')

    const commands = await tbb.fetchCommandsEditing()

    for (const command of commands) {
      await knex('BFMASTERCOMMANDS').where({
        COMMANDNO: command.commandNo,
        MACHINEID: machineId,
      }).insert({
        ADVICELIST: (command.adviceList && command.adviceList.length) ? command.adviceList : -1,
        DONTUSELIST: command.dontUseList,
      })
    }
    return commands
  } catch (err) {
    console.error(err)
  }
})
