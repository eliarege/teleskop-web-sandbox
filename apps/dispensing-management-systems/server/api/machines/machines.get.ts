import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async () => {
  try {
    const machines: Array<Machine> = await dmsDB('MACHINE').select({
      machineId: 'machine_id',
      machineName: 'machine_name',
      controllerType: 'controller_type',
    })
      .orderBy('machine_id')
    return machines
  } catch (e) {
    console.log(e)
    return e
  }
})
