import { dmsDB } from '~/server/connectionPool'
import type { Tank } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const newTank: Tank = await readBody(event)

  try {
    const res = await dmsDB('MACHINE_TANK')
      .insert({
        machine_id: newTank.machineId,
        dispenser_id: newTank.dispenserId,
        tank_no: newTank.tankNo,
        tank_name: newTank.tankName,
        tank_cap: newTank.tankCap,
      })
      return res
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating tank',
      data: error.message,
    })
  }
})
