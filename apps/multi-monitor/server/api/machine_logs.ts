import connection from '~/server/connectionPool'
import type { BatchLogs } from '~~/shared/types'

export default defineEventHandler(async (event) => {
  await connection.pool.connect()
  const { machineId } = getQuery(event)
  const res = await connection.pool.query<BatchLogs>(
    `SELECT
      d.ID as id,
      d.PLANKEY as planKey,
      d.MACHINEID as machineId,
      d.JOBORDER as jobOrder,
      d.PROGRAMINDEX as programIndex,
      d.PROGRAMNO as programNo,
      d.RECIPETYPE as recipeType,
      d.REQUESTPROGRAMINDEX as requestprogramIndex,
      d.STATUS as status,
      d.EVENTTIME as eventTime,
      d.EXPLANATION as explanation
      FROM DYBFBATCHORDERRECIPESTEPLOGS d
      WHERE d.MACHINEID = ${machineId}`,
  )
  return res.recordset
})
