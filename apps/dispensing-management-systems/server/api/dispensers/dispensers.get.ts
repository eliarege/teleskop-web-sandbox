import { dmsDB } from '~/server/connectionPool'
import type { Dispenser } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const dispensers: Array<Dispenser> = await dmsDB('DISPENSER').select({
      dispenser_id: 'dispenser_id',
      dispenser_name: 'dispenser_name',
      ip_address: 'ip_address',
      password: 'password',
      dispenser_type: 'dispenser_type',
      protocol: 'protocol',
      last_consumption_control: 'last_consumption_control',
      read_consumption_from_dms: 'read_consumption_from_dms',
      consumption_filename: 'consumption_filename',
      bdy_requestname: 'bdy_requestname',
      bdy_requestpath: 'bdy_requestpath',
    })
      .orderBy('dispenser_id')
    return dispensers.filter(val => val.dispenserId !== -1)
  } catch (e) {
    console.log(e)
    return e
  }
})
