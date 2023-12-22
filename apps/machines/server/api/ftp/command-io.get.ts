import { TbbFtpClient } from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'
import { getIOName } from '~/server/utils'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new TbbFtpClient('192.168.88.202')

    const commands = await tbb.fetchCommandIO()

    await knex('BFCOMMANDINPUTOUTPUTS').del()
    await knex('BFCOMMANDSELECTIONLIST').del()

    for (const [index, command] of commands.entries()) {
      for (const [i, c] of command.chooseList.entries()) {
        const obj = {
          IOINDEX: i,
          MACHINEID: Number.parseInt(machineId),
          NAME: c.name.length ? c.name : 'bos',
          COMMANDNO: command.commandNo,
          IOID: Number.parseInt(c.ioId),
          IOTYPE: (c.ioType <= 4 && c.ioType >= 0 && c.name.length > 0) ? 5 : Number.parseInt(c.ioType),
          PROGRAMEDITING: false,
          COMMANDRUN: false,
        }
        await knex('BFCOMMANDINPUTOUTPUTS').insert(obj)

        await knex('BFCOMMANDSELECTIONLIST').insert({
          IOINDEX: index,
          MACHINEID: machineId,
          COMMANDNO: command.commandNo,
          SELECTINDEX: i,
          IOTYPE: c.ioType,
          IOID: c.ioId,
          NAME: (c.name && c.name.length) ? c.name : await getIOName(machineId, c.ioType, c.ioId),
          SELECTEDIOID: c.ioId,
          ISDEFAULT: c.isDefault,
          MODEL: 'MODEL',
          EXTENTION: 'EXTENTION',
        })
      }
    }

    return commands
  } catch (err) {
    console.error(err)
  }
})
