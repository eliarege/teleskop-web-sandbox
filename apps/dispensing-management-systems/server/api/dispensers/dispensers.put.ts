import { dmsDB } from '~/server/connectionPool'
import type { Dispenser } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const dispenser: Dispenser = await readBody(event)
    const res = await dmsDB('DISPENSER').where({
      dispenserId: dispenser.dispenserId,
    }).update({
      dispenserId: dispenser.dispenserId,
      dispenserName: dispenser.dispenserName,
      dispenserIP: dispenser.dispenserIP,
      dipenserPswrd: dispenser.dipenserPswrd,
      dispenserType: dispenser.dispenserType,
      protocol: dispenser.protocol,
      lastConsumptionControl: dispenser.lastConsumptionControl,
      readConsumptionFromDMS: dispenser.readConsumptionFromDMS,
      consumptionFilename: dispenser.consumptionFilename,
      bdyRequestName: dispenser.bdyRequestName,
      bdyRequestPath: dispenser.bdyRequestName,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
