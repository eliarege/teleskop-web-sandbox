import { dmsDB } from '~/server/connectionPool'
import type { Material } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const { code } = getRouterParams(event)
    const material: Material = await dmsDB('MATERIAL as m')
      .where('material_code', code)
      .select({
        materialName: 'm.material_name',
        materialCode: 'm.material_code',
        materialGroupNo: 'm.material_group_no',
        density: 'm.density',
        ph: 'm.ph',
        source: 'm.source',
        costUnit: 'm.cost_unit',
        unitCost: 'm.unit_cost',
        reRequestable: 'm.re_requestable',
        directTransfer: 'm.direct_transfer',
        connectedDispensers: dmsDB.raw(`
        ARRAY(
        SELECT JSON_BUILD_OBJECT('dispenserId', d.dispenser_id, 'dispenserName', d.dispenser_name)
        FROM "DISPENSER_MATERIAL_CONNECTION" AS dmc
        JOIN "DISPENSER" AS d ON dmc.dispenser_id = d.dispenser_id
        WHERE dmc.material_code = m.material_code
        ORDER BY d.dispenser_id
        )`),
      }).first()
    if (!material)
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
      })
    return material
  } catch (e) {
    console.log(e)
    return e
  }
})
