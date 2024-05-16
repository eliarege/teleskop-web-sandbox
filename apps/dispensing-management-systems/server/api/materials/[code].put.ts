import { dmsDB } from '~/server/connectionPool'
import { MaterialSchema } from '~/shared/schemas'
import type { Material } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const material: Material = await readValidatedBody(event, MaterialSchema.parse)
  const res = await dmsDB('MATERIAL')
    .where('material_code', material.materialCode)
    .update({
      material_name: material.materialName,
      material_code: material.materialCode,
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
