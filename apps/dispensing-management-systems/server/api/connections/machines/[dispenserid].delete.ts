import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { dispenserid } = getRouterParams(event)
    const connections = await readBody(event)
    const res = await dmsDB('DISPENSER_MACHINE_CONNECTION')
      .whereIn('machine_id', connections)
      .andWhere('dispenser_id', dispenserid)
      .del()
    return res
  } catch (e) {
    console.log(e)
    return e
  }
})
