import { dmsDB } from '~/server/connectionPool'
import type { Dispenser } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const { id } = getRouterParams(event)
    const dispenser: Dispenser = await dmsDB('DISPENSER as d').select({
      dispenserId: 'd.dispenser_id',
      dispenserName: 'd.dispenser_name',
      dispenserIP: 'd.ip_address',
      dipenserPswrd: 'd.password',
      dispenserType: 'd.dispenser_type',
      dispenserBrand: 't.dispenser_brand_id',
      dispenserBrandName: 'b.brand_name',
      protocol: 'd.protocol',
      lastConsumptionControl: 'd.last_consumption_control',
      readConsumptionFromDMS: 'd.read_consumption_from_dms',
      consumptionFilename: 'd.consumption_filename',
      fileName: 'd.bdy_requestname',
      filePath: 'd.bdy_requestpath',
    })
      .join('DISPENSER_TYPE as t', 't.dispenser_type_id', 'd.dispenser_type')
      .join('DISPENSER_BRAND as b', 't.dispenser_brand_id', 'b.brand_id')
      .where('dispenser_id', id)
      .first()
    return dispenser
  } catch (e) {
    console.log(e)
    return e
  }
})
