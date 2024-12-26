import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const config = useRuntimeConfig()

  const startParameters = await db
    .with('distinct_parameters', (qb) => {
      qb
        .distinct('BATCHKEY', 'BATCHPARAMETERID', 'PARAMSTRING')
        .from('BABATCHPARAMETERS')
        .where('BATCHKEY', batchKey)
    })
    .from('distinct_parameters as dp')
    .select({
      id: 'dp.BATCHPARAMETERID',
      name: 'dp.PARAMSTRING',
      paramValues: db.raw(/* sql */`(
        SELECT
          FORMAT(DATEADD(MINUTE, :timezoneOffset, p.CHANGEDATE), 'yyyy-MM-ddTHH:mm:ssZ') as time
        , p.VALUE value
        FROM BABATCHPARAMETERS p
        WHERE dp.BATCHKEY = p.BATCHKEY
          AND dp.BATCHPARAMETERID = p.BATCHPARAMETERID
        ORDER BY p.CHANGEDATE
        FOR JSON AUTO, INCLUDE_NULL_VALUES
      )`, { timezoneOffset: config.teleskopTimezoneOffset }),
    })
    .orderBy('dp.BATCHPARAMETERID')

  for (const param of startParameters) {
    param.paramValues = JSON.parse(param.paramValues)
  }
  return startParameters
})
