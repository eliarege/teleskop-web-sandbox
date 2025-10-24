import { dmsDB } from '~/server/connectionPool'
import type { Tank } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const tank: Tank = await readBody(event)

  try {
    const res = await dmsDB('MACHINE_TANK')
      .where({ machine_id: id, tank_no: tank.tankNo })
      .update({
        tank_name: tank.tankName,
        tank_cap: tank.tankCap,
        dispenser_id: tank.dispenserId,
        additional_cap: tank.additionalCap,
        tank_type: tank.tankType,
        auto_water_system: tank.autoWaterSystem,
        external_water_system: tank.externalWaterSystem,
        level_sensor_plc_no: tank.levelSensorPlcNo,
        level_sensor_plc_id: tank.levelSensorPlcId,
        level_sensor_input_no: tank.levelSensorInputNo,
        fill_water_before_percentage: tank.fillWaterBeforePercentage,
        mixing_time: tank.mixingTime,
        des_tank_id: tank.desTankId,
      })
    return res
  } catch (error: any) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error updating tank',
      data: error.message,
    })
  }
})
