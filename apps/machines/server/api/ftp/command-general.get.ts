import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const commands = (await tbb.fetchCommandsGeneral()).map(command => ({
      ...command,
      activated: (command.activated === '1' && command.machineConstantId && command.machineConstantId !== -1) ? 1 : 0,
    }))

    // await knex('BFMASTERCOMMANDS').del()
    // await knex('BFMASTERCOMMANDS').insert(commands)

    return commands
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
