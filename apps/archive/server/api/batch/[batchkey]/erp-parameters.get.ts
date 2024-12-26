import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)

  return await db('BFERPPARAMETERDEFINITIONS as E')
    .select('E.PARAMID', 'E.PARAMNAME', 'E.BATCHREPORTVISIBLE')
    .join('BADATA as D', function () {
      this.on('D.MACHINEID', '=', 'E.MACHINEID')
    })
    .where('D.BATCHKEY', '=', batchKey)
    .orderBy('E.PARAMID', 'asc')
})
