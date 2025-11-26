import { dmsDB } from '~/server/connectionPool'
import type { Material } from '~/shared/types'

export default defineEventHandler(async () => {
  const materials: Material[] = await dmsDB('MATERIAL as m')
    .select({
      materialName: 'm.material_name',
      materialCode: 'm.material_code',
      materialGroupNo: 'm.material_group_no',
      isManual: 'm.is_manual',
      connectedDispensers: dmsDB.raw(`
        ARRAY(
          SELECT JSON_BUILD_OBJECT('dispenserId', d.dispenser_id, 'dispenserName', d.dispenser_name)
          FROM "DISPENSER_MATERIAL_CONNECTION" AS dmc
          JOIN "DISPENSER" AS d ON dmc.dispenser_id = d.dispenser_id
          WHERE dmc.material_code = m.material_code
          ORDER BY d.dispenser_id
        )
      `),
    })
    .orderBy('m.material_code')

  return materials
})
