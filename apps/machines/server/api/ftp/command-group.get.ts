import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const commands = await tbb.fetchCommandGroups()
    const commandGroups = commands?.map(c => ({
      ...c,
      machineId,
    }))

    await knex('BFCOMMANDGROUP').del()
    await knex('BFCOMMANDGROUP').insert(commandGroups)

    return commandGroups
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
