import { knex } from '../knexConfig'

export async function getCurrentRunningIndex(batchKey: number) {
  const runningIndex = await knex.raw(/* sql */
  `
    SELECT
      COUNT(DISTINCT PRGNO) AS currentRunningPrgIndex
    FROM BAACTUALPRGSTEPS
    WHERE BATCHKEY = ${batchKey} AND PARALLELSTEPNO = 0
  `,
  )
  return runningIndex[0]
}
