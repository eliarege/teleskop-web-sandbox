import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const { id } = getRouterParams(event)
    const machine: Array<Machine> = await dmsDB('MACHINE as m').select({
      machineId: 'm.machine_id',
      machineName: 'm.machine_name',
      controllerType: 'm.controller_type',
      connectedDispensers: dmsDB.raw(`
      ARRAY(
        SELECT JSON_BUILD_OBJECT('dispenserId', d.dispenser_id, 'dispenserName', d.dispenser_name)
        FROM "DISPENSER_MACHINE_CONNECTION" AS dmc
        JOIN "DISPENSER" AS d ON dmc.dispenser_id = d.dispenser_id
        WHERE dmc.machine_id = m.machine_id
        ORDER BY d.dispenser_id
      )
    `),
    })
      .where('m.machine_id', id)
      .first()
    return machine
  } catch (e) {
    console.log(e)
    return e
  }
})
