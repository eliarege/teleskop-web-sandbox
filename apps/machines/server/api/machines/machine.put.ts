import { z } from 'zod'
import { dmExchangeKnex, knex } from '~/server/connectionPool'
import { isMachineLocked } from '~/server/lib/machine-lock'
import { upsertMachineToDmExchange } from '~/server/lib/dmexchange'
import { machineSchema } from '~/shared/schemas/machine'

const updateMachineSchema = z.object({
  id: z.number().int().positive(),
  data: machineSchema,
})

export default defineAuthEventHandler(async (event) => {
  const { id, data: machine } = await readValidatedBody(event, updateMachineSchema.parse)
  const res = isMachineLocked(id)
  if (res.locked) {
    throw createError({
      message: `Machine ${id} is currently locked for update`,
      statusCode: 423,
      data: { reason: res.reason },
    })
  }

  try {
    const res = await knex.transaction(async (trx) => {
      const updateResult = await trx('BFMACHINES').where({
        MACHINEID: id,
      }).update({
        MACHINEID: Number(machine.machineId),
        MACHINECODE: machine.machineCode,
        GRUPNO: machine.groupId,
        TBBMODEL: machine.tbbModel,
        THEORICALCHARGE: machine.theoreticalCharge,
        MACHINECAPACITY: machine.machineCapacity,
        IP: machine.ip,
        PORT: 8080,
        VERSION: machine.version,
        NOZZLECOUNT: machine.nozzleCount,
        theoricalChargeDuration: machine.theoreticalChargeDuration,
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

      if (dmExchangeKnex) {
        await upsertMachineToDmExchange(dmExchangeKnex, {
          machineId: machine.machineId,
          machineCode: machine.machineCode,
          groupId: Number(machine.groupId),
          machineCapacity: machine.machineCapacity,
          theoreticalCharge: machine.theoreticalCharge,
          inUse: machine.inUse,
        })
      }

      return updateResult
    })
    return res
  } catch (err) {
    console.error('Error updating machine:', err)
    throw createError({ statusCode: 500 })
  }
})
