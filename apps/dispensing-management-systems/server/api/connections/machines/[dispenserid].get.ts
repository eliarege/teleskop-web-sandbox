import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const { dispenserid } = getRouterParams(event)
    const connectedMachines: Array<Machine> = await dmsDB('DISPENSER_MACHINE_CONNECTION as c').select({
      machineId: 'c.machine_id',
      machineName: 'm.machine_name',
    })
      .where('c.dispenser_id', '=', dispenserid)
      .distinctOn('c.machine_id')
      .leftJoin('MACHINE as m', 'm.machine_id', 'c.machine_id')
      .orderBy('c.machine_id')
    return connectedMachines
  } catch (e) {
    console.log(e)
    return e
  }
})
