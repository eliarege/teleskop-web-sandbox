import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineAuthEventHandler(async () => {
  const machines: Machine[] = await knex('BFMACHINES')
    .select({
      machineId: 'MACHINEID',
      machineCode: 'MACHINECODE',
      groupNo: 'GRUPNO',
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
    })

  return machines
})
