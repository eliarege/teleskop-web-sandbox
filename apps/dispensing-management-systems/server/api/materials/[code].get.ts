import { dmsDB } from '~/server/connectionPool'
import type { Material } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const { code } = getRouterParams(event)
    const material: Material = await dmsDB('MATERIAL')
      .where('material_code', code)
      .select({
        materialName: 'material_name',
        materialCode: 'material_code',
        materialGroupNo: 'material_group_no',
        density: 'density',
        ph: 'ph',
        source: 'source',
        costUnit: 'cost_unit',
        unitCost: 'unit_cost',
        reRequestable: 're_requestable',
        directTransfer: 'direct_transfer',
      }).first()
    return material
  } catch (e) {
    console.log(e)
    return e
  }
})
