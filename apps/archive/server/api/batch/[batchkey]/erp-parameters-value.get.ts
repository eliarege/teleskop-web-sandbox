import { db } from '~/server/database'
import type { ERPParameter } from '~/types/archive'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)

  if (!batchKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    })
  }

  const result: ERPParameter[] = await db('BABATCHPARAMETERS as P')
    .select({
      parameterId: 'P.BATCHPARAMETERID',
      parameterName: 'P.PARAMSTRING',
      value: 'P.VALUE',
      unit: 'U.UNITTEXT',
    })
    .join('BADATA as D', 'P.BATCHKEY', 'D.BATCHKEY')
    .join('BFMACHBATCHPARAMETERS as U', function () {
      this.on('U.BATCHPARAMETERID', '=', 'P.BATCHPARAMETERID')
        .andOn('U.MACHINEID', '=', 'D.MACHINEID')
    })
    .join('BFERPPARAMETERDEFINITIONS as E', function () {
      this.on('E.PARAMID', '=', 'P.BATCHPARAMETERID')
        .andOn('E.MACHINEID', '=', 'D.MACHINEID')
    })
    .where('P.BATCHKEY', batchKey)
    .whereNull('P.PROGNO')
    .where('E.BATCHREPORTVISIBLE', true)
    .orderBy('P.BATCHPARAMETERID', 'asc')

  return result
})
