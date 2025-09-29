import { z } from 'zod'
import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const schema = z.object({
      machineId: z.number({ message: 'MACHINE_ID_REQUIRED' }),
      tank: z.object({ tankNo: z.number({ message: 'TANK_NO_REQUIRED' }) }),
      materialCode: z.string().min(1, 'INVALID_MATERIAL_CODE'),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'INVALID_REQ_BODY',
        data: { message: parsed.error.errors[0]?.message || 'INVALID_REQ_BODY', errors: parsed.error.errors },
      })
    }
    const { machineId, tank, materialCode } = parsed.data

    const deleted = await knex('DYTFMATERIALTANKMAP')
      .where({
        MACHINEID: machineId,
        MATERIALCODE: materialCode,
        TANKNO: tank.tankNo,
      }).del()

    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: 'MATERIAL_TANK_MAPPING_NOT_FOUND',
        data: { message: 'MATERIAL_TANK_MAPPING_NOT_FOUND' },
      })
    }
    return { success: true, message: 'MATERIAL_TANK_MAPPING_DELETED' }
  } catch (error: any) {
    if (error.statusCode)
      throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_SERVER_ERROR',
      data: { message: 'INTERNAL_SERVER_ERROR' },
    })
  }
})
