import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)
    const connections = await readBody(event)
    const res = await dmsDB('DISPENSER_MACHINE_CONNECTION')
      .whereIn('dispenser_id', connections)
      .andWhere('machine_id', machineId)
      .del()
    return res
  } catch (e) {
    console.log(e)
    return e
  }
})
