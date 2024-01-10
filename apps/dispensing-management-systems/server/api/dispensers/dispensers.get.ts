import { dmsDB } from '~/server/connectionPool'
import type { Dispenser } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const dispensers: Array<Dispenser> = await dmsDB('DISPENSER').select({
      dispenserId: 'dispenser_id',
      dispenserName: 'dispenser_name',
      dispenserIP: 'ip_address',
      dipenserPswrd: 'password',
      dispenserType: 'dispenser_type',
      protocol: 'protocol',
      lastConsumptionControl: 'last_consumption_control',
      readConsumptionFromDMS: 'read_consumption_from_dms',
      consumptionFilename: 'consumption_filename',
      fileName: 'bdy_requestname',
      filePath: 'bdy_requestpath',
    })
    .orderBy('dispenser_id')
    return dispensers
  } catch (e) {
    console.log(e)
    return e
  }
})
