import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { filters } = await readBody(event)
  const selectParams = {
    machineId: 'MACHINEID',
    machineCode: 'MACHINECODE',
    groupId: 'GRUPNO',
    groupName: 'GROUPNAME',
    tbbModel: 'TBBMODEL',
    plcModel: 'PlcModel',
    ip: 'IP',
    theoricalCharge: 'THEORICALCHARGE',
    theoricalChargeDuration: 'theoricalChargeDuration',
    machineCapacity: 'MACHINECAPACITY',
    reelCount: 'REELCOUNT',
    nozzleCount: 'NOZZLECOUNT',
    steamUnit: 'STEAMUNIT',
    steamKgPerHour: 'STEAMKGPERHOUR',
    additionalTank1: 'ADDITIONALTANK1',
    additionalTank2: 'ADDITIONALTANK2',
    additionalTank3: 'ADDITIONALTANK3',
    additionalTank4: 'ADDITIONALTANK4',
    reserveTank: 'RESERVETANK',
    storeElectricityAsInc: 'STOREELECTRICITYASINC',
    theoreticalWater: 'theoricWater',
    inUse: 'INUSE',
    MTTempIo: 'MTTEMPIO',
    version: 'VERSION',
    productModel: 'PRODUCTMODEL',
    hardwareModel: 'HARDWAREMODEL',
    steamValveDo: 'STEAMVALVEDO',
    theoreticalSteam: 'theoricSteam',
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
