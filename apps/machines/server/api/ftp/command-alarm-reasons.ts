import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const commandAlarmReasons = await tbb.fetchCommandAlarmReasons()

    const modifiedCommandAlarmReasons = commandAlarmReasons.map((r) => {
      return {
        ID: r.id,
        REASONTEXT: r.reasonText,
        GROUPID: r.groupId,
      }
    })

    await knex('BFCOMMANDTIMEOUTREASONS').del()
    await knex('BFCOMMANDTIMEOUTREASONS').insert(modifiedCommandAlarmReasons)

    return commandAlarmReasons
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
