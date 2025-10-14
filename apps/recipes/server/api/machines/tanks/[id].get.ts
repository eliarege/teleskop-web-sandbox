import { dmsDB } from '~/server/connectionPool'
import type { Tank } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const tanks: Array<Tank> = await dmsDB('MACHINE_TANK').select({
    machineId: 'machine_id',
    tankNo: 'tank_no',
    tankName: 'tank_name',
    tankCap: 'tank_cap',
    dispenserId: 'dispenser_id',
    additionalCap: 'additional_cap',
    tankType: 'tank_type',
    autoWaterSystem: 'auto_water_system',
    externalWaterSystem: 'external_water_system',
    levelSensorPlcNo: 'level_sensor_plc_no',
    levelSensorPlcId: 'level_sensor_plc_id',
    levelSensorInputNo: 'level_sensor_input_no',
    fillWaterBeforePercentage: 'fill_water_before_percentage',
    mixingTime: 'mixing_time',
    desTankId: 'des_tank_id',
  })
    .where('machine_id', id)
  if (!tanks)
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    })
  return tanks
})
