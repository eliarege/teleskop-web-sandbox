import { dmsDB } from '~/server/connectionPool'
import type { Dispenser } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const dispenser: Dispenser = await readBody(event)
  const res = await dmsDB('DISPENSER').insert({
    dispenser_id: dispenser.dispenserId,
    dispenser_name: dispenser.dispenserName,
    ip_address: dispenser.dispenserIP,
    vnc_user: dispenser.vncUser,
    vnc_port: dispenser.vncPort,
    vnc_password: dispenser.vncPassword,
    dispenser_type: dispenser.dispenserType,
    protocol: dispenser.protocol,
    protocol_fields: dispenser.protocolFields,
    last_consumption_control: dispenser.lastConsumptionControl,
    is_jdm: dispenser.isJDM,
    jdm_connections: dispenser.JDMConnections,
  })
  return res
})
