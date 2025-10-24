import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { dispenserid } = getRouterParams(event)
  const { added, deleted } = await readBody(event)
  if (deleted.length > 0)
    await dmsDB('DISPENSER_MATERIAL_CONNECTION')
      .whereIn('material_code', deleted)
      .andWhere('dispenser_id', dispenserid)
      .del()
  if (added.length > 0) {
    const insertRows = added.map((materialCode: any) => ({
      material_code: materialCode,
      dispenser_id: dispenserid,
    }))
    await dmsDB('DISPENSER_MATERIAL_CONNECTION').insert(insertRows)
      .onConflict(['dispenser_id', 'material_code']).ignore()
  }
  return null
})
