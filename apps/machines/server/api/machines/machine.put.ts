import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const machine = await readBody(event)
    const res = await knex('BFMACHINES').where({
      MACHINEID: machine.id,
    }).update({
      MACHINECODE: machine.code,
      GRUPNO: machine.group.groupId,
      TBBMODEL: machine.tbbModel,
      THEORICALCHARGE: machine.theoricalCharge,
      MACHINECAPACITY: machine.machineCapacity,
      IP: machine.ip,
      PORT: -1,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
