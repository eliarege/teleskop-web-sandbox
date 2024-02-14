import { dmsDB } from '~/server/connectionPool'
import type { Material } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const { dispenserid } = getRouterParams(event)
    const connectedMaterials: Array<Material[]> = await dmsDB('DISPENSER_MATERIAL_CONNECTION as c').select({
      materialCode: 'c.material_code',
      materialName: 'm.material_name',

    })
      .where('c.dispenser_id', '=', dispenserid)
      .distinctOn('c.material_code')
      .leftJoin('MATERIAL as m', 'm.material_code', 'c.material_code')
      .orderBy('c.material_code')
    return connectedMaterials
  } catch (e) {
    console.log(e)
    return e
  }
})
