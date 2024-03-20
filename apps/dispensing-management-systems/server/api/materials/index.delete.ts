import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { materialCode } = await readBody(event)
  await dmsDB('DISPENSER_MATERIAL_CONNECTION').where('material_code', materialCode).del()
  const res = await dmsDB('MATERIAL').where('material_code', materialCode).del()
  return res
})
