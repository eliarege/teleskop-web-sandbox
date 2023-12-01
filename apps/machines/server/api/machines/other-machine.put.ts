import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machine, oldId } = await readBody(event)
    const res = await knex('BFMACHINES')
      .where('MACHINEID', oldId)
      .update({
        MACHINEID: machine.machineId,
        MACHINECODE: machine.machineName,
        INUSE: machine.inUse,
      })
    return res
  } catch (e) {
    console.log('e = ', e)
    return e
  }
})
