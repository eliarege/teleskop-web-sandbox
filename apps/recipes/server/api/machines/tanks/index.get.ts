import { dmsDB } from '~/server/connectionPool'
import type { Tank } from '~/shared/types'

export default defineEventHandler(async () => {
  const tanks: Array<Tank> = await dmsDB('MACHINE_TANK as t').select({
    machineId: 'm.machine_id',
    machineName: 'm.machine_name',
    dispenserId: 't.dispenser_id',
    tankNo: 't.tank_no',
    tankName: 't.tank_name',
  }).leftJoin('MACHINE as m', 'm.machine_id', 't.machine_id').orderBy(['m.machine_id', 't.tank_no'])
  if (!tanks)
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    })
  return tanks
})
