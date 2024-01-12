import { dmsDB } from '~/server/connectionPool'
import type { Dispenser } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const dispenser: Dispenser = await readBody(event)
    const res = await dmsDB('DISPENSER').where({
      dispenser_id: dispenser.dispenserId,
    }).update({
      dispenser_id: dispenser.dispenserId,
      dispenser_name: dispenser.dispenserName,
      ip_address: dispenser.dispenserIP,
      password: dispenser.dipenserPswrd,
      dispenser_type: dispenser.dispenserType,
      protocol: dispenser.protocol,
      last_consumption_control: dispenser.lastConsumptionControl,
      read_consumption_from_dms: dispenser.readConsumptionFromDMS,
      consumption_filename: dispenser.consumptionFilename,
      bdy_requestname: dispenser.fileName,
      bdy_requestpath: dispenser.filePath,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
