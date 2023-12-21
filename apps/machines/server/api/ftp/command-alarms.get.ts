import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const commands = await tbb.fetchCommandAlarms()
    const functionAlarms = await tbb.fetchFunctionAlarms()

    await knex('BFMASTERCOMMANDSALARMS').del()
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
            MACHINEID: machineId,
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
})
