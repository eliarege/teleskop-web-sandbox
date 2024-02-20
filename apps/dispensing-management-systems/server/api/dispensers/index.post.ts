import { dmsDB } from '~/server/connectionPool'
import type { Dispenser } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const dispenser: Dispenser = await readBody(event)
    const res = await dmsDB('DISPENSER').insert({
      dispenser_id: dispenser.dispenserId,
      dispenser_name: dispenser.dispenserName,
      ip_address: dispenser.dispenserIP,
      password: dispenser.dipenserPswrd,
      dispenser_type: dispenser.dispenserType,
      protocol: dispenser.protocol,
      protocol_fields: dispenser.protocolFields,
      last_consumption_control: dispenser.lastConsumptionControl,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
