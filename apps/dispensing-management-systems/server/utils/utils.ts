import type { Knex } from "knex"

export async function batchInsert(knex: Knex, data: any[], batchSize: number, tableName: string, colName: string) {
  const totalRows = data.length
  const numBatches = Math.ceil(totalRows / batchSize)
  await useTransaction(knex, async (trx) => {
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize
      const end = Math.min((i + 1) * batchSize, totalRows)
      const batch = data.slice(start, end)

      // Generate the SQL query for batch insertion with ON CONFLICT DO UPDATE
      const insertQuery = trx(tableName)
        .insert(batch)
        .toQuery()

      const conflictUpdateFields = Object.keys(batch[0])
        .map(key => `"${key}" = EXCLUDED."${key}"`) // Map each field to "field = EXCLUDED.field"
        .join(', ')

      const onConflictUpdateQuery = `${insertQuery} ON CONFLICT (${colName}) DO UPDATE SET ${conflictUpdateFields}`

      // Execute the query
      await trx.raw(onConflictUpdateQuery)
    }
  })
}
function useTransaction(knex: Knex, callback: (...args: any[]) => void) {
  if (knex.isTransaction) {
    return callback(knex)
  } else {
    return knex.transaction(trx => callback(trx))
  }
}
