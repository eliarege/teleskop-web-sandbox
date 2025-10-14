import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const res = await dmsDB('DISPENSER').where('dispenser_id', id).del()
  return res
})
