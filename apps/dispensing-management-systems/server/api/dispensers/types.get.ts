import { dmsDB } from '~/server/connectionPool'
import type { DispenserType } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const dispenserTypes: Array<DispenserType> = await dmsDB('DISPENSER_TYPE as T').select({
      dispenserTypeId: 'T.dispenser_type_id',
      dispenserTypeName: 'T.dispenser_type_name',
      dispenserBrandId: 'B.brand_id',
      dispenserBrandName: 'B.brand_name',
    })
      .join('DISPENSER_BRAND as B', 'B.brand_id', 'T.dispenser_brand_id')
      .orderBy('dispenser_type_id')
    return dispenserTypes
  } catch (e) {
    console.log(e)
    return e
  }
})
