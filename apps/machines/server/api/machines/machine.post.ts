import { knex } from '~/server/connectionPool'
import { machineSchema } from '~/shared/schemas/machine'

export default defineAuthEventHandler(async (event) => {
  const machine = await readValidatedBody(event, machineSchema.parse)

  const res = await knex('BFMACHINES').insert({
    MACHINEID: machine.machineId,
    MACHINECODE: machine.machineCode,
    GRUPNO: machine.groupId,
    TBBMODEL: machine.tbbModel,
    THEORICALCHARGE: machine.theoricalCharge,
    MACHINECAPACITY: machine.machineCapacity,
    IP: machine.ip,
    VERSION: machine.version,
    NOZZLECOUNT: machine.nozzleCount,
    theoricalChargeDuration: machine.theoricalChargeDuration,
    REELCOUNT: machine.reelCount,
    STEAMUNIT: machine.steamUnit,
    INUSE: machine.inUse,
    USEINTELESKOP: 1,
    MTTEMPIO: machine.MTTempIo,
    STEAMKGPERHOUR: machine.steamKgPerHour,
    STEAMVALVEDO: machine.steamValveDo,
    theoricSteam: machine.theoreticalSteam,
    THEORETICALWATER: machine.theoreticalWater,
    STOREELECTRICITYASINC: machine.storeElectricityAsInc,
    ADDITIONALTANK1: machine.additionalTank1,
    ADDITIONALTANK2: machine.additionalTank2,
    ADDITIONALTANK3: machine.additionalTank3,
    ADDITIONALTANK4: machine.additionalTank4,
    RESERVETANK: machine.reserveTank,
    PORT: 8080,
  })
  return res
})
