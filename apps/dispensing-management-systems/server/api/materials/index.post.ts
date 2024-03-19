import { dmsDB } from '~/server/connectionPool'
import type { Material } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const material: Material = await readBody(event)
  const res = await dmsDB('MATERIAL')
    .insert({
      material_code: material.materialCode,
      material_name: material.materialName,
      material_group_no: material.materialGroupNo,
      density: material.density,
      ph: material.ph,
      source: material.source,
      cost_unit: material.costUnit,
      unit_cost: material.unitCost,
      re_requestable: material.reRequestable,
      direct_transfer: material.directTransfer,
    })
  return res
})
