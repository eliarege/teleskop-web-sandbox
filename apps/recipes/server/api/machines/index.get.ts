import { dmsDB } from '~/server/connectionPool'
import type { Machine } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { programNo } = getQuery(event)

  let query = dmsDB('MACHINE as m')
    .leftJoin('MACHINE_GROUP as g', 'm.machine_id', 'g.machine_id')

  // If programNo is provided (either single number or array), filter machines
  if (programNo) {
    const programNumbers = Array.isArray(programNo) ? programNo : [programNo]

    // Only return machines that have ALL the required program numbers
    query = query.whereExists(function () {
      this.select(dmsDB.raw('1'))
        .from('PROGRAM_HEADER as ph')
        .whereRaw('ph.machine_id = m.machine_id')
        .whereIn('ph.program_no', programNumbers)
        .groupBy('ph.machine_id')
        .havingRaw('COUNT(DISTINCT ph.program_no) = ?', [programNumbers.length])
    })
  }

  const machines: Array<Machine> = await query
    .select({
      machineId: 'm.machine_id',
      machineName: 'm.machine_name',
      machineGroup: 'g.group_id',
      controllerType: 'm.controller_type',
      tanks: dmsDB.raw(`
        ARRAY(
          SELECT JSON_BUILD_OBJECT('tankNo', t.tank_no, 'tankName', t.tank_name, 'tankCap', t.tank_cap)
          FROM "MACHINE_TANK" AS t
          WHERE t.machine_id = m.machine_id
          ORDER BY t.tank_no
        )
      `),
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
    .orderBy('m.machine_id')

  return machines
})
