import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const machine = await readBody(event)
  const res = await knex('BFMACHINES')
    .insert({
      MACHINEID: machine.machineId,
      MACHINECODE: machine.machineCode,
      INUSE: machine.inUse,
      USEINTELESKOP: false,
      GRUPNO: -1,
      TBBMODEL: '',
      THEORICALCHARGE: -1,
      MACHINECAPACITY: -1,
      IP: '',
      PORT: 8080,
    })
  return res
})
