import { dmsDB } from '~/server/connectionPool'
import type { DispenserBrand } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const dispenserBrands: Array<DispenserBrand> = await dmsDB('DISPENSER_BRAND').select({
      dispenserBrandId: 'brand_id',
      dispenserBrandName: 'brand_name',
    })
      .orderBy('brand_id')
    return dispenserBrands
  } catch (e) {
    console.log(e)
    return e
  }
})
