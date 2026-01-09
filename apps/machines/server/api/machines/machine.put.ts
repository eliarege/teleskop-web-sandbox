import { z } from 'zod'
import { knex } from '~/server/connectionPool'
import { isMachineLocked } from '~/server/lib/machine-lock'
import { machineSchema } from '~/shared/schemas/machine'

const updateMachineSchema = z.object({
  id: z.number().int().positive(),
  data: machineSchema,
})

export default defineAuthEventHandler(async (event) => {
  const { id, data: machine } = await readValidatedBody(event, updateMachineSchema.parse)
  if (isMachineLocked(id)) {
    throw createError({
      message: `Machine ${id} is currently locked for update`,
      statusCode: 423,
    })
  }

  try {
    const res = await knex('BFMACHINES').where({
      MACHINEID: id,
    }).update({
      MACHINEID: Number(machine.machineId),
      MACHINECODE: machine.machineCode,
      GRUPNO: machine.groupId,
      TBBMODEL: machine.tbbModel,
      THEORICALCHARGE: machine.theoricalCharge,
      MACHINECAPACITY: machine.machineCapacity,
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
  } catch (err) {
    console.error('Error updating machine:', err)
    throw createError({ statusCode: 500 })
  }
})
