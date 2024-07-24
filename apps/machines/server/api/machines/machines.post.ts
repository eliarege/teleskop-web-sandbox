import { filtersToKnex } from 'utils'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters } = await readBody(event)
  const selectParams = {
    machineId: 'MACHINEID',
    machineCode: 'MACHINECODE',
    tbbModel: 'TBBMODEL',
    version: 'VERSION',
    machineCapacity: 'MACHINECAPACITY',
    ip: 'IP',
    inUse: 'INUSE',
    plcModel: 'PlcModel',
    nozzleCount: 'NOZZLECOUNT',
    groupName: 'GROUPNAME',
    groupNo: 'GRUPNO',
    theoricalCharge: 'THEORICALCHARGE',
    theoricalChargeDuration: 'theoricalChargeDuration',
    reelCount: 'REELCOUNT',
    steamUnit: 'STEAMUNIT',
    MTTempIo: 'MTTEMPIO',
    steamKgPerHour: 'STEAMKGPERHOUR',
    steamValveDo: 'STEAMVALVEDO',
  }

  const query = knex('BFMACHINES')
    .select(selectParams)
    .leftJoin('BFMACHGROUP', 'BFMACHINES.GRUPNO', 'BFMACHGROUP.GROUPID')
    .where('GRUPNO', '!=', -1)
    .orderBy('MACHINEID')

  if (filters)
    filtersToKnex(filters, selectParams, query)

  return await query
})
