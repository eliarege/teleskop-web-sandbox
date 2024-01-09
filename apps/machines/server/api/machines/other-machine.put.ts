import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machine, oldId } = await readBody(event)

  const res = await knex('BFMACHINES')
    .where('MACHINEID', oldId)
    .update({
      MACHINEID: machine.machineId,
      MACHINECODE: machine.machineCode,
      INUSE: machine.inUse,
    })
  return res
})
