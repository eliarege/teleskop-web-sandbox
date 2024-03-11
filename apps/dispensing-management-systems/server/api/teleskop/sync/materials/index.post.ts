import { batchInsert } from '~/shared/utils'

export default defineEventHandler(async (event) => {
  try {
    const teleskopData = await readBody(event)

    const materials: any[] = []

    teleskopData.materials?.forEach((data: any) => {
      const material = ({
        material_code: data.materialCode,
        material_name: data.materialName,
        material_group_no: data.materialGroupNo,
        density: data.density,
        ph: data.ph,
        source: data.source,
        cost_unit: data.costUnit,
        unit_cost: data.unitCost,
        re_requestable: data.reRequestable,
        direct_transfer: data.directTransfer,
      })
      materials.push(material)
    })

    const batchSize = 3000
    await batchInsert(materials, batchSize, 'MATERIAL', 'material_code')
  } catch (e) {
    console.error(e)
    return e
  }
})
