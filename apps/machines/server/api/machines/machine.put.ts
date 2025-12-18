import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineAuthEventHandler(async (event) => {
  const { formData } = await readBody<{ formData: Machine }>(event)
  try {
    const res = await knex('BFMACHINES').where({
      MACHINEID: formData.machineId,
    }).update({
      MACHINEID: Number(formData.machineId),
      MACHINECODE: formData.machineCode,
      GRUPNO: formData.groupId,
      TBBMODEL: formData.tbbModel,
      THEORICALCHARGE: formData.theoricalCharge,
      MACHINECAPACITY: formData.machineCapacity,
      PlcModel: formData.plcModel,
      IP: formData.ip,
      PORT: 8080,
      VERSION: formData.version,
      NOZZLECOUNT: formData.nozzleCount,
      theoricalChargeDuration: formData.theoricalChargeDuration,
      REELCOUNT: formData.reelCount,
      STEAMUNIT: formData.steamUnit,
      INUSE: formData.inUse,
      MTTEMPIO: formData.MTTempIo,
      STEAMKGPERHOUR: formData.steamKgPerHour,
      STEAMVALVEDO: formData.steamValveDo,
      ADDITIONALTANK1: formData.additionalTank1,
      ADDITIONALTANK2: formData.additionalTank2,
      ADDITIONALTANK3: formData.additionalTank3,
      ADDITIONALTANK4: formData.additionalTank4,
      RESERVETANK: formData.reserveTank,
      STOREELECTRICITYASINC: formData.storeElectricityAsInc,
      THEORETICALWATER: formData.theoreticalWater,
      THEORETICALSTEAM: formData.theoreticalSteam,
    })
    return res
  } catch (err) {
    console.error('Error updating machine:', err)
    throw createError({ statusCode: 500 })
  }
})
