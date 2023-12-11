import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

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
  ftpClient.close()
})
