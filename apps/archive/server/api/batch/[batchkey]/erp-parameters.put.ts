import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const body = await readBody(event)
  for (const param of body.erpParameters) {
    await db.raw(`
      UPDATE E
      SET E.BATCHREPORTVISIBLE = ?
      FROM BFERPPARAMETERDEFINITIONS AS E
      INNER JOIN BADATA AS D ON D.MACHINEID = E.MACHINEID
      WHERE D.BATCHKEY = ?
        AND E.PARAMID = ?
    `, [param.BATCHREPORTVISIBLE, batchKey, param.PARAMID])
  }
  return 1
})
