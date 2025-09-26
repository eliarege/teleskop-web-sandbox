import process from 'node:process'
import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { filters } = await readBody(event)

  const selectParams = {
    machineId: 'MachineId',
    machineCode: 'MACHINECODE',
    eventKey: 'EventKey',
    eventCode: 'EventCode',
    eventStart: 'EventStart',
    eventEnd: 'EventEnd',
    archived: 'ARCHIVED',
  }

  const timezoneOffset = Number(process.env.NUXT_TELESKOP_TIMEZONE_OFFSET || 0)

  const query = knex('BFMachineAccessFails')
    .leftJoin('BFMACHINES', 'BFMACHINES.MACHINEID', 'BFMachineAccessFails.MachineId')
    .select({
      ...selectParams,
      eventStart: knex.raw('DATEADD(minute, ?, BFMachineAccessFails.EventStart)', [timezoneOffset]),
      eventEnd: knex.raw('DATEADD(minute, ?, BFMachineAccessFails.EventEnd)', [timezoneOffset]),
    })
  if (filters)
    filtersToKnex(filters, selectParams, query)

  return await query
})
