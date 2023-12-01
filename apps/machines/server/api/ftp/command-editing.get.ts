import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

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
  ftpClient.close()
})
