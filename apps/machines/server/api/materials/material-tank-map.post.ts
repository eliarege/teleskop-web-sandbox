import { z } from 'zod'
import { knex } from '~/server/connectionPool'

const materialSchema = z.object({
  materialCode: z.string().min(1, 'INVALID_MATERIAL_CODE'),
})

const tankSchema = z.object({
  machineId: z.number({ message: 'MACHINE_ID_REQUIRED' }),
  tankNo: z.number({ message: 'TANK_NO_REQUIRED' }),
  materials: z.array(materialSchema).default([]),
})

const schema = z.object({
  tankMap: z.array(tankSchema).min(1, 'INVALID_TANK_STRUCTURE'),
})

export default defineAuthEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'INVALID_REQ_BODY',
        data: {
          message: parsed.error.errors[0]?.message || 'INVALID_REQ_BODY',
          errors: parsed.error.errors,
        },
      })
    }

    const { tankMap } = parsed.data

    await knex.transaction(async (trx) => {
      for (const tank of tankMap) {
        await trx('DYTFMATERIALTANKMAP')
          .where({
            MACHINEID: tank.machineId,
            TANKNO: tank.tankNo,
          }).del()
        for (const material of tank.materials) {
          await trx('DYTFMATERIALTANKMAP')
            .insert({
              MACHINEID: tank.machineId,
              MATERIALCODE: material.materialCode,
              TANKNO: tank.tankNo,
            })
        }
      }
    })

    return { success: true, message: 'TANK_MATERIAL_MAPPING_UPDATED' }
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
