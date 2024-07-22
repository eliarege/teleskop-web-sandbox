import type { Knex } from 'knex'

export async function batchInsert(knex: Knex, data: any[], batchSize: number, tableName: string, conflictColumns?: string[]) {
  const totalRows = data.length
  const numBatches = Math.ceil(totalRows / batchSize)
  await useTransaction(knex, async (trx: Knex) => {
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize
      const end = Math.min((i + 1) * batchSize, totalRows)
      const batch = data.slice(start, end)

      const query = trx(tableName).insert(batch)
      if (conflictColumns) {
        query.onConflict(conflictColumns).merge()
      }
      await query
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
