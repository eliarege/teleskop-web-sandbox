import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { code } = getRouterParams(event)
  await dmsDB('DISPENSER_MATERIAL_CONNECTION').where('material_code', code).del()
  const res = await dmsDB('MATERIAL').where('material_code', code).del()
  return res
})
