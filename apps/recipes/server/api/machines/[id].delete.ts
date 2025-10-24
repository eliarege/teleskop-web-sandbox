import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const res = await dmsDB('MACHINE').where('machine_id', id).del()
  return res
})
