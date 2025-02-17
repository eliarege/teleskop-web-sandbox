import connection from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  await connection.pool.connect()
  const { batchKey } = getQuery(event)
  const response = await connection.pool.query<{ currentRunningPrgIndex: number }>(`\
  SELECT COUNT(DISTINCT PRGNO) AS currentRunningPrgIndex FROM BAACTUALPRGSTEPS
  WHERE BATCHKEY = ${batchKey} AND PARALLELSTEPNO = 0
  `)
  return response.recordset[0]
})
