import { dmsDB } from '~/server/connectionPool'
import type { Material } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const materials: Material[] = await dmsDB('MATERIAL')
      .select({
        materialName: 'material_name',
        materialCode: 'material_code',
        materialGroupNo: 'material_group_no',
      })
      .orderBy('material_code')
    return materials
  } catch (e) {
    console.log(e)
    return e
  }
})
