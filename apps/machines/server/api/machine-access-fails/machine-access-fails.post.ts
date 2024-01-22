import { filtersToKnex } from 'utils/src/index'
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
    return await filtersToKnex(filters, selectParams, query)

  return await query
})
