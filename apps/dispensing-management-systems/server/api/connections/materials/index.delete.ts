import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { materialCode } = getQuery(event)
    const connections = await readBody(event)
    const res = await dmsDB('DISPENSER_MATERIAL_CONNECTION')
      .whereIn('dispenser_id', connections)
      .andWhere('material_code', materialCode)
      .del()
    return res
  } catch (e) {
    console.log(e)
    return e
  }
})
