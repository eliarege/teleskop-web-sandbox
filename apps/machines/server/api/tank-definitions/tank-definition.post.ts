import { z } from 'zod'
import { knex } from '~/server/connectionPool'

const tankDefinitionSchema = z.object({
  machineId: z.number(),
  tankNo: z.number(),
  name: z.string(),
  highLimit: z.number(),
  machineConstantHighLimit: z.number(),
})

export default defineAuthEventHandler(async (event) => {
  try {
    const { machineId, tankNo, name, highLimit, machineConstantHighLimit } = await readBody(event)

    const parsed = tankDefinitionSchema.safeParse({ machineId, tankNo, name, highLimit, machineConstantHighLimit })
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

    if (existingTank) {
      throw createError({
        statusCode: 409,
        statusMessage: 'TANK_DEFINITION_EXISTS',
        data: { message: 'TANK_DEFINITION_EXISTS' },
      })
    }

    await knex('BFMACHINETANKS')
      .insert({
        MACHINEID: machineId,
        TANKNO: tankNo,
        NAME: name,
        HIGHLIMIT: highLimit,
        MACHINECONSTANTHIGHLIMIT: machineConstantHighLimit,
      })

    return {
      success: true,
      message: 'TANK_DEFINITION_CREATED',
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
