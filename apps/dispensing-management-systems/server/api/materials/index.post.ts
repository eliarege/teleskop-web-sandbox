import { dmsDB } from '~/server/connectionPool'
import { ErrorCodes } from '~/shared/constants'
import type { Material } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const material: Material = await readBody(event)
  try {
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
  } catch (e: any) {
    if (e.code === ErrorCodes.unique) {
      setResponseStatus(event, 403, 'A Material with that code already exists.')
      event.node.res.end()
    }
  }
})
