import { TbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new TbbFtpClient('192.168.88.202')

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
})
