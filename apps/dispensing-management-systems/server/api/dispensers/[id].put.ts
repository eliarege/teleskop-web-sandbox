import { dmsDB } from '~/server/connectionPool'
import type { Dispenser } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const dispenser: Dispenser = await readBody(event)
    const res = await dmsDB('DISPENSER').where({
      dispenser_id: dispenser.dispenserId,
    }).update({
      dispenser_name: dispenser.dispenserName,
      ip_address: dispenser.dispenserIP,
      dispenser_type: dispenser.dispenserType,
      vnc_user: dispenser.vncUser,
      vnc_port: dispenser.vncPort,
      vnc_password: dispenser.vncPassword,
      protocol: dispenser.protocol,
      protocol_fields: dispenser.protocolFields,
      last_consumption_control: dispenser.lastConsumptionControl,
      is_jdm: dispenser.isJDM,
      jdm_connections: dispenser.JDMConnections,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
