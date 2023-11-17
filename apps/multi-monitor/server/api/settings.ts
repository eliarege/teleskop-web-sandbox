import connection from '~/server/connectionPool'
import teleskopSettingsSql from '~/server/queries/TeleskopSettings.sql'

interface Test {
  id: number
  value: number
}
export default defineEventHandler(async (event) => {
  await connection.pool.connect()
  const response = await connection.pool.query<Test>(teleskopSettingsSql)
  return response.recordset[0].value.toString()
})
