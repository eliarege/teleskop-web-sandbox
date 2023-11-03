import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineIds } = await readBody(event)
    const res = await knex('BFMACHINES').whereIn('MACHINEID', machineIds).del()
    return res
  } catch (e) {
    return e
  }
})
