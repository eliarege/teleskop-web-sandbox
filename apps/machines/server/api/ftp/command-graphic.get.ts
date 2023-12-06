import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const commands = await tbb.fetchCommandGraphic()

    for (const c of commands) {
      await knex('BFMASTERCOMMANDS').where({
        COMMANDNO: c.commandNo,
        MACHINEID: machineId,
      }).update({
        ISTEMPERATURE: !!((c.type == 2 || c.type == 6)),
        ISUNLOAD: !!((c.type == 4 || c.type == 6)),
        X: c.x,
        Y: c.y,
        A: c.a,
        MAXA: c.maxA,
        B: c.b,
      })
    }

    return commands
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
