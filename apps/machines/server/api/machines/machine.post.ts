import { knex } from '~/server/connectionPool'
import type { Machine } from '~/types'

export default defineEventHandler(async (event) => {
  const machine: Machine = await readBody(event)
  const res = await knex('BFMACHINES').insert({
    MACHINEID: machine.id,
    MACHINECODE: machine.code,
    GRUPNO: machine.group.groupId,
    TBBMODEL: machine.tbbModel,
    THEORICALCHARGE: machine.theoricalCharge,
    MACHINECAPACITY: machine.machineCapacity,
    IP: machine.ip,
    PORT: -1,
  })
  return res
})
