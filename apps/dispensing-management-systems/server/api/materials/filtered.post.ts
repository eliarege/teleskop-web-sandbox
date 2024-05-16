import { filtersToKnex } from '../../../../../packages/utils/src/knex'
import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters } = await readBody(event)
  const selectParams = ({
    materialName: 'm.material_name',
    materialCode: 'm.material_code',
    materialGroupNo: 'm.material_group_no',
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
  const materials = dmsDB('MATERIAL as m')
    .select(selectParams)
    .orderBy('m.material_code')

  if (filters)
    return await filtersToKnex(filters, selectParams, materials)
  return await materials
})
