import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const parameterIds = (await db('BFERPPARAMETERDEFINITIONS as E')
    .select('E.PARAMID')
    .join('BADATA as D', function () {
      this.on('D.MACHINEID', '=', 'E.MACHINEID')
    })
    .where('D.BATCHKEY', '=', batchKey)
    .andWhere('E.BATCHREPORTVISIBLE', '=', true)
    .orderBy('E.PARAMID', 'asc')).map(e => e.PARAMID)
  return await db('BABATCHPARAMETERS as P')
    .whereIn('P.BATCHPARAMETERID', parameterIds)
    .select({
      parameterId: 'P.BATCHPARAMETERID',
      parameterName: 'P.PARAMSTRING',
      value: 'P.VALUE',
      unit: 'U.UNITTEXT',
    })
    .whereNull('P.PROGNO')
    .andWhere('P.BATCHKEY', '=', batchKey)
    .orderBy('P.BATCHPARAMETERID', 'asc')
    .join('BFMACHBATCHPARAMETERS as U', function () {
      this.on('U.BATCHPARAMETERID', '=', 'P.BATCHPARAMETERID')
    })
    .join('BADATA as D', function () {
      this.on('P.BATCHKEY', '=', 'D.BATCHKEY')
        .andOn('D.MACHINEID', '=', 'U.MACHINEID')
    })
})
