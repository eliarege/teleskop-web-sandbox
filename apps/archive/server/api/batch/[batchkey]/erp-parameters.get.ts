import { db } from '~/server/database'
import type { ERPParameterDefinition } from '~/types/archive'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)

  const result: ERPParameterDefinition[] = await db('BFERPPARAMETERDEFINITIONS as E')
    .select({
      paramId: 'E.PARAMID',
      paramName: 'E.PARAMNAME',
      batchReportVisible: 'E.BATCHREPORTVISIBLE',
    })
    .join('BADATA as D', function () {
      this.on('D.MACHINEID', '=', 'E.MACHINEID')
    })
    .where('D.BATCHKEY', '=', batchKey)
    .orderBy('E.PARAMID', 'asc')

  return result
})
