import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, machineCode, inUse, oldId } = await readBody(event)

  const res = await knex('BFMACHINES')
    .where('MACHINEID', oldId)
    .update({
      MACHINEID: machineId,
      MACHINECODE: machineCode,
      INUSE: inUse,
    })
  return res
})
