import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = await readBody(event)
    const res = await knex('BFMACHINES')
      .where('MACHINEID', machineId)
      .del()
    return res
  } catch (e) {
    return e
  }
})
