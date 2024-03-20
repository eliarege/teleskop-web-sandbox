import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineEventHandler(async (event) => {
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
    IP: machine.ip,
    PORT: -1,
    VERSION: machine.version,
    NOZZLECOUNT: machine.nozzleCount,
    PLCMODEL: machine.plcModel,
    theoricalChargeDuration: machine.theoricalChargeDuration,
    REELCOUNT: machine.reelCount,
    STEAMUNIT: machine.steamUnit,
    INUSE: machine.inUse,
    MTTEMPIO: machine.MTTempIo,
    STEAMKGPERHOUR: machine.steamKgPerHour,
    STEAMVALVEDO: machine.steamValveDo,
  })
  return res
})
