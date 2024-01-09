import { filtersToKnex } from 'utils/src/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { filters, machineIds, eventCodes } = await readBody(event)
    const selectParams = {
      machineId: 'MachineId',
      machineName: 'MACHINECODE',
      eventKey: 'EventKey',
      eventCode: 'EventCode',
      eventStart: 'EventStart',
      eventEnd: 'EventEnd',
      archived: 'ARCHIVED',
    }
    const query = knex('BFMachineAccessFails')
      .leftJoin('BFMACHINES', 'BFMACHINES.MACHINEID', 'BFMachineAccessFails.MachineId')
      .whereIn('MachineId', machineIds)
      .whereIn('EventCode', eventCodes)
      .select(selectParams)
    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query

})
