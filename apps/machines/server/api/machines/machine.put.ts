import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const { machine, machineId } = await readBody<{ machine: Machine, machineId: number }>(event)

  const res = await knex('BFMACHINES').where({
    MACHINEID: machineId,
  }).update({
    MACHINEID: machine.machineId,
    MACHINECODE: machine.machineCode,
    GRUPNO: machine.groupId,
    TBBMODEL: machine.tbbModel,
    THEORICALCHARGE: machine.theoricalCharge,
    MACHINECAPACITY: machine.machineCapacity,
    PlcModel: machine.plcModel,
    IP: machine.ip,
    PORT: 8080,
    VERSION: machine.version,
    NOZZLECOUNT: machine.nozzleCount,
    theoricalChargeDuration: machine.theoricalChargeDuration,
    REELCOUNT: machine.reelCount,
    STEAMUNIT: machine.steamUnit,
    INUSE: machine.inUse,
    MTTEMPIO: machine.MTTempIo,
    STEAMKGPERHOUR: machine.steamKgPerHour,
    STEAMVALVEDO: machine.steamValveDo,
    ADDITIONALTANK1: machine.additionalTank1,
    ADDITIONALTANK2: machine.additionalTank2,
    ADDITIONALTANK3: machine.additionalTank3,
    ADDITIONALTANK4: machine.additionalTank4,
    RESERVETANK: machine.reserveTank,
    STOREELECTRICITYASINC: machine.storeElectricityAsInc,
    THEORETICALWATER: machine.theoreticalWater,
    THEORETICALSTEAM: machine.theoreticalSteam,
  })

  return res
})
