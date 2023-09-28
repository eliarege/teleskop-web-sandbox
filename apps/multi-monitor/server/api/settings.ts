import connection from '~/server/connectionPool'

interface Test {
  id: number
  value: number
}
export default defineEventHandler(async (event) => {
  await connection.pool.connect()
  const response = await connection.pool.query<Test>(
    'SELECT ID as id , VALUE as value  FROM TFTELESKOPSETTINGS WHERE ID = 2',
  )
  return response.recordset[0].value.toString()
})
