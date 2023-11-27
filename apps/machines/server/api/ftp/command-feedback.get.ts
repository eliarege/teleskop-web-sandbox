import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = await getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const commandFeedback = await tbb.fetchCommandFeedback()

    await knex('BFMASTERCOMMANDRETURNVALUES').del()
    await knex('BFMASTERCOMMANDRETURNVALUES').insert(commandFeedback?.map(c => ({
      MACHINEID: machineId,
      COMMANDNO: c.commandNo,
      RETURNVALUEINDEX: c.PVNo.split(' ')[1],
      RETURNVALUENAME: c.returnValueName,
      CANSHOW: c.canShow,
      SPRELATION: c.SPRelation,
    })))

    return commandFeedback
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
