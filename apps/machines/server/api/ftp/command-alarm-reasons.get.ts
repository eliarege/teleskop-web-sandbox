import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = await getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const commandAlarmReasons = await tbb.fetchCommandAlarmReasons()

    const timeoutReasons = commandAlarmReasons.map((r) => {
      return {
        ID: r.id,
        REASONTEXT: r.reasonText,
        GROUPID: r.groupId,
      }
    })
    await knex('BFCOMMANDTIMEOUTREASONS').del()
    await knex('BFCOMMANDTIMEOUTREASONS').insert(timeoutReasons)

    const commandMapEntries = []
    for (const reason of commandAlarmReasons) {
      for (const commandNo of reason.commandNumbers) {
        const mapEntry = {
          REASONID: reason.id,
          MACHINEID: machineId,
          COMMANDNO: commandNo,
        }
        commandMapEntries.push(mapEntry)
      }
    }
    await knex('BFCOMMANDTIMEOUTREASONMAP').del()
    await knex('BFCOMMANDTIMEOUTREASONMAP').insert(commandMapEntries)

    return commandMapEntries
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
