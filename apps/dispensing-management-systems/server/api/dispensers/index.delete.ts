import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { dispenserIds } = await readBody(event)
    const res = await dmsDB('DISPENSER').whereIn('dispenser_id', dispenserIds).del()
    return res
  } catch (e) {
    return e
  }
})
