import connection from '~/server/connectionPool'
import type { Interventions } from '~/shared/types'

export default defineEventHandler(async (event) => {
  await connection.pool.connect()
  const { interventParam } = getQuery(event)
  const response = await connection.pool.query<Interventions>(
    `SELECT 
      b.INTERVENTKEY AS interventKey,
      b.INTERVENTTIME as interventTime,
      b.MACHINEID AS machineId,
      b.BATCHKEY as batchKey,
      b.EVENTID as eventId,
      b.P1 as pOne,
      b.P2 as pTwo,
      b.P3 as pThree,
      b.EXPLANATION as explanation
    FROM TFMACHINESTATUS s
      LEFT JOIN BAINTERVENTION b ON s.RUNNING_BATCHKEY  = b.BATCHKEY 
    WHERE s.MACHINEID = ${interventParam}`)
  return response.recordset
})
