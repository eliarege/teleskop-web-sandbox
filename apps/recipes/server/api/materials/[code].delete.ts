import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { code } = getRouterParams(event)
  const decodedCode = decodeURIComponent(code)
  await dmsDB('DISPENSER_MATERIAL_CONNECTION').where('material_code', decodedCode).del()
  const res = await dmsDB('MATERIAL').where('material_code', decodedCode).del()
  return res
})
