import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const { id } = getRouterParams(event)
    const machine: Array<Machine> = await dmsDB('MACHINE').select({
      machineId: 'machine_id',
      machineName: 'machine_name',
      controllerType: 'controller_type',
    })
      .where('dispenser_id', id)
      .first()
    return machine
  } catch (e) {
    console.log(e)
    return e
  }
})
