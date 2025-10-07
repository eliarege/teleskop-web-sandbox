import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, machineCode, inUse, oldId } = await readBody(event)

  if (machineId !== oldId) {
    const existingMachine = await knex('BFMACHINES')
      .where('MACHINEID', machineId)
      .first()

    if (existingMachine) {
      throw createError({
        statusCode: 409,
        statusMessage: 'ID_INUSE',
      })
    }
  }

  const res = await knex('BFMACHINES')
    .where('MACHINEID', oldId)
    .update({
      MACHINEID: machineId,
      MACHINECODE: machineCode,
      INUSE: inUse,
    })
  return res
})
