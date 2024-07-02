import { inferBoolean } from '@teleskop/utils'
import connection from '~/server/connectionPool'
import query from '~/server/queries/TrendData.sql'
import trendDataSql from '~/server/queries/TrendDataMock.sql'
import type { Trends } from '~/shared/types'

export default defineEventHandler(async (_event) => {
  const config = useRuntimeConfig()
  await connection.pool.connect()
  const response = await connection.pool.query<Trends>(inferBoolean(config.isStaging) ? trendDataSql : query)
  return response.recordset[0]
})
