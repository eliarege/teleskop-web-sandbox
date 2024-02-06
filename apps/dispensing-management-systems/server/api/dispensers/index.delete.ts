import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const dispenserId = await readBody(event)
    const res = await dmsDB('DISPENSER').where('dispenser_id', dispenserId).del()
    return res
  } catch (e) {
    return e
  }
})
