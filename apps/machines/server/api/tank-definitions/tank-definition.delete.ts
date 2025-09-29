import { z } from 'zod'
import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { machineId, tankNo } = await readBody(event)

    const deleteSchema = z.object({
      machineId: z.number(),
      tankNo: z.number(),
    })

    const parsed = deleteSchema.safeParse({ machineId, tankNo })
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'INVALID_REQ_BODY',
        data: {
          message: 'INVALID_REQ_BODY',
          errors: parsed.error.errors,
        },
      })
    }
    const existingTank = await knex('BFMACHINETANKS')
      .where({
        MACHINEID: machineId,
        TANKNO: tankNo,
      })
      .first()

    if (!existingTank) {
      throw createError({
        statusCode: 404,
        statusMessage: 'TANK_DEFINITION_NOT_FOUND',
        data: { message: 'TANK_DEFINITION_NOT_FOUND' },
      })
    }

    await knex('BFMACHINETANKS')
      .where({
        MACHINEID: machineId,
        TANKNO: tankNo,
      })
      .del()

    return {
      success: true,
      message: 'TANK_DEFINITION_DELETED',
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_SERVER_ERROR',
      data: { message: 'INTERNAL_SERVER_ERROR' },
    })
  }
})
