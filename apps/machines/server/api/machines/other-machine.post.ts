import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const machine = await readBody(event)

  // Check if a machine with the same ID already exists
  const existingMachine = await knex('BFMACHINES')
    .where('MACHINEID', machine.machineId)
    .first()

  if (existingMachine) {
    throw createError({
      statusCode: 409,
      statusMessage: 'ID_INUSE',
    })
  }

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
