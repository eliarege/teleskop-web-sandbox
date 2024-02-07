import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineEventHandler(async (event) => {
  const machine: Machine = await readBody(event)
  console.log('machine = ', machine)
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
    PLCMODEL: machine.plcModel,
    theoricalChargeDuration: machine.theoricalChargeDuration,
    REELCOUNT: machine.reelCount,
    STEAMUNIT: machine.steamUnit,
    INUSE: machine.inUse,
    MTTEMPIO: machine.MTTempIo,
    STEAMKGPERHOUR: machine.steamKgPerHour,
    STEAMVALVEDO: machine.steamValveDo,
    PORT: -1,
  })
  return res
})
