import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const machine = await readBody(event)
    const res = await knex('BFMACHINES')
      .insert({
        MACHINEID: machine.machineId,
        MACHINECODE: machine.machineName,
        INUSE: machine.inUse,
        USEINTELESKOP: false,
        GRUPNO: -1,
        TBBMODEL: '',
        THEORICALCHARGE: -1,
        MACHINECAPACITY: -1,
        IP: '',
        PORT: -1,
      })
    return res
  } catch (e) {
    return e
  }
})
