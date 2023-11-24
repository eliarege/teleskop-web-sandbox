import fs from 'node:fs'
import * as ftp from 'basic-ftp'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  // const {machineId} = getQuery(event)
  const machineId = 3
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = false
  try {
    const tbb = new TBB6500FtpClient('192.168.88.202')

    const commands = await tbb.fetchCommandAlarms()
    const functionAlarms = await tbb.fetchFunctionAlarms()

    // await knex('BFMASTERCOMMANDSALARMS').del()
    for (const c of commands) {
      let functionName = await knex('BFMASTERCOMMANDS').where({
        MACHINEID: machineId,
        COMMANDNO: c.commandNo,
      }).select('TBBFUNTIONNAME')

      if (functionName && functionName.length) {
        functionName = functionName[0].TBBFUNTIONNAME

        const obj = functionAlarms?.find(a => a.f == functionName)

        if (obj) {
          const properties = Object.keys(obj)
          let index = -1

          for (let i = 0; i < properties.length; i++) {
            const values = obj[properties[i]]
            if (values && values.includes(c.alarmNo)) {
              index = i
            }
          }
          await knex('BFMASTERCOMMANDSALARMS').insert({
            ALARMINDEX: c.alarmNo,
            ALARMNO: c.alarmNo,
            UNIVERSALALARMNO: c.alarmNo,
            ALARM: c.alarm,
            ALARMTYPE: index !== -1 ? index + 1 : null,
          })
        }
      }
    }

    return functionAlarms
  } catch (err) {
    console.error(err)
  }
  ftpClient.close()
})
