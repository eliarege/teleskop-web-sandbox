import { z } from 'zod'
import { knex } from '~/server/connectionPool'

const schema = z.object({ machineId: z.coerce.number({ message: 'MACHINE_ID_REQUIRED' }) })

export default defineAuthEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const parsed = schema.safeParse(query)
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'INVALID_REQ_BODY',
        data: { message: parsed.error.errors[0]?.message || 'INVALID_REQ_BODY', errors: parsed.error.errors },
      })
    }
    const { machineId } = parsed.data

    const tanks = await knex('BFMACHINETANKS')
      .where('MACHINEID', machineId)
      .select({
        machineId: 'MACHINEID',
        tankName: 'NAME',
        tankNo: 'TANKNO',
        materials: knex.raw(`ISNULL((
          select
            ID as materialId,
            DYTFMATERIALTANKMAP.MATERIALCODE as materialCode,
            DYTFMATERIALTANKMAP.MACHINEID as machineId,
            DYTFMATERIAL.MATERIALNAME as materialName,
            DYTFMATERIAL.MADDEGRUPNO as materialGroupNo,
            PREWATER as preWater,
            BETWEENWATER as betweenWater,
            POSTWATER as postWater
          from DYTFMATERIALTANKMAP
          left join DYTFMATERIAL on DYTFMATERIAL.MATERIALCODE = DYTFMATERIALTANKMAP.MATERIALCODE
          where DYTFMATERIALTANKMAP.TANKNO = BFMACHINETANKS.TANKNO
          and  DYTFMATERIALTANKMAP.MACHINEID = BFMACHINETANKS.MACHINEID
          for json path, INCLUDE_NULL_VALUES
        ), '[]')`),
      })

    return tanks.map(t => ({
      ...t,
      materials: JSON.parse(t.materials),
    }))
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
