import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { dispenserId } = await readBody(event)
  const res = await dmsDB('DISPENSER').where('dispenser_id', dispenserId).del()
  return res
})
