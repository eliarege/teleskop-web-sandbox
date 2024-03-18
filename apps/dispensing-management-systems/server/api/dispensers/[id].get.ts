import { dmsDB } from '~/server/connectionPool'
import type { Dispenser } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const { id } = getRouterParams(event)
    const dispenser: Dispenser = await dmsDB('DISPENSER as d').select({
      dispenserId: 'd.dispenser_id',
      dispenserName: 'd.dispenser_name',
      dispenserIP: 'd.ip_address',
      dispenserType: 'd.dispenser_type',
      dispenserBrandId: 't.dispenser_brand_id',
      dispenserBrandName: 'b.brand_name',
      vncUser: 'd.vnc_user',
      vncPort: 'd.vnc_port',
      vncPassword: 'd.vnc_password',
      protocol: 'd.protocol',
      protocolFields: 'd.protocol_fields',
      lastConsumptionControl: 'd.last_consumption_control',
      isJDM: 'd.is_jdm',
      JDMConnections: 'd.jdm_connections',
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
