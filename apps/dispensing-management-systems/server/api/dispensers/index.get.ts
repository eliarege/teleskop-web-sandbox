import { dmsDB } from '~/server/connectionPool'
import type { Dispenser } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const dispensers: Array<Dispenser> = await dmsDB('DISPENSER as d').select({
      dispenserId: 'd.dispenser_id',
      dispenserName: 'd.dispenser_name',
      dispenserIP: 'd.ip_address',
      dipenserPswrd: 'd.password',
      dispenserType: 'd.dispenser_type',
      dispenserBrandId: 't.dispenser_brand_id',
      dispenserBrandName: 'b.brand_name',
      protocol: 'd.protocol',
      lastConsumptionControl: 'd.last_consumption_control',
    })
      .join('DISPENSER_TYPE as t', 't.dispenser_type_id', 'd.dispenser_type')
      .join('DISPENSER_BRAND as b', 't.dispenser_brand_id', 'b.brand_id')
      .orderBy('dispenser_id')
    return dispensers.filter(val => val.dispenserId !== -1)
  } catch (e) {
    console.log(e)
    return e
  }
})
