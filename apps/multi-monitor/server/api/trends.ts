import connection from '~/server/connectionPool'
import query from '~/server/queries/TrendData.sql'
import mockQuery from '~/server/queries/TrendDataMock.sql'
import type { Trends } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await connection.pool.connect()
  const response = await connection.pool.query<Trends>(config.isStaging ? mockQuery : query)
  return response.recordset
})
