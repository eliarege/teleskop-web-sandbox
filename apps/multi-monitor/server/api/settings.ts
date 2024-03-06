import connection from '~/server/connectionPool'

interface Setting {
  id: number
  value: string
}
export default defineEventHandler(async () => {
  await connection.pool.connect()
  const response = await connection.pool.query<Setting>(`\
SELECT ID as id , VALUE as value
FROM TFTELESKOPSETTINGS WHERE ID = 2`)
  return { washing: response.recordset[0].value === '1' }
})
