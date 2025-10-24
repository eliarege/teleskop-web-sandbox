import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const machine: Machine = await dmsDB('MACHINE as m')
    .leftJoin('MACHINE_GROUP as g', 'm.machine_id', 'g.machine_id')
    .select({
      machineId: 'm.machine_id',
      machineName: 'm.machine_name',
      machineGroup: 'g.group_id',
      capacity: dmsDB.raw('CAST(m.capacity AS NUMERIC)'),
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

  if (!machine)
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    })

  // Ensure capacity is parsed as a number
  return {
    ...machine,
    capacity: machine.capacity !== null ? Number(machine.capacity) : null,
  }
})
