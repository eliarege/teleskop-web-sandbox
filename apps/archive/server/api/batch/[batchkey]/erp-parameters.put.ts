import { db } from '~/server/database'
import type { ERPParameterDefinition } from '~/types/archive'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const body = await readBody(event)

  const erpParameters: ERPParameterDefinition[] = body.erpParameters ?? []

  if (!batchKey || erpParameters.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    })
  }

  for (const param of erpParameters) {
    await db.raw(`
      UPDATE E
      SET E.BATCHREPORTVISIBLE = ?
      FROM BFERPPARAMETERDEFINITIONS AS E
      INNER JOIN BADATA AS D ON D.MACHINEID = E.MACHINEID
      WHERE D.BATCHKEY = ?
        AND E.PARAMID = ?
    `, [param.batchReportVisible, batchKey, param.paramId])
  }

  return {
    success: true,
    updatedCount: erpParameters.length,
  }
})
