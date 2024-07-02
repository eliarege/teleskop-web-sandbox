import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
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
  const query = knex('BFMachineAccessFails')
    .leftJoin('BFMACHINES', 'BFMACHINES.MACHINEID', 'BFMachineAccessFails.MachineId')
    .select(selectParams)
  if (filters)
    filtersToKnex(filters, selectParams, query)

  return await query
})
