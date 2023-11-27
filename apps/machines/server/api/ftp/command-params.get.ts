import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = await getQuery(event)
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const commands = await tbb.fetchCommandParams()

    /*  await knex('BFCOMMANDPARAMETERS').del()
    for (const c of commands) {
      await knex('BFCOMMANDPARAMETERS').insert({
        MACHINEID: machineId,
        COMMANDNO: c.commandNo,
        PARAMSTRING: c.name,
        COMMANDDEFINITION: false,
        PROGRAMEDITING: c.binding == 1,
        BATCHPLANNING: false,
        BATCHSTART: c.binding == 2,
        COMMANDRUN: false,
        RECIPE: false,
        VALUE: c.paramFormula ?? c.defaultValue,
        PARAMETERTYPE: (c.selectionList || globalCommandFormula) ? 1 : 0,
        SELECTIONLIST: c.selectionList.filter((c, i) => i % 2 == 0),
        SELECTIONVALUES: c.selectionList.filter((c, i) => i % 2 == 1),
        UNITCODE: 0,
        PARAMLOWLIMIT: c.minValue,
        PARAMHIGHLIMIT: c.maxValue,
        CONTAINSVARIABLE: !!c.paramFormula,
        TEMPERATURE: c.graphic,
        USEDEFAULT: c.binding == 2 || c.binding == 3,
        ISCOMMANDVARIABLE: false,
        TBBFORMUL: !!c.paramFormula,
        USEFORMULA: c.binding == 5,
      })
    } */

    return commands
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
