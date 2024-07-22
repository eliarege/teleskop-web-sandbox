import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { materialCode } = getQuery(event)
  const { added, deleted } = await readBody(event)
  if (deleted.length > 0) {
    await dmsDB('DISPENSER_MATERIAL_CONNECTION')
      .whereIn('dispenser_id', deleted)
      .andWhere('material_code', materialCode)
      .del()
  }
  if (added.length > 0) {
    const insertRows = added.map((dispenserId: any) => ({
      material_code: materialCode,
      dispenser_id: dispenserId,
    }))
    await dmsDB('DISPENSER_MATERIAL_CONNECTION').insert(insertRows)
      .onConflict(['dispenser_id', 'material_code']).ignore()
  }
  return null
})
