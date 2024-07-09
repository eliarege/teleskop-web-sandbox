import type { Knex } from 'knex'

export async function batchInsert(knex: Knex, data: any[], batchSize: number, tableName: string, colName?: string) {
  const totalRows = data.length
  const numBatches = Math.ceil(totalRows / batchSize)
  await useTransaction(knex, async (trx) => {
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize
      const end = Math.min((i + 1) * batchSize, totalRows)
      const batch = data.slice(start, end)

      const insertQuery = trx(tableName)
        .insert(batch)
        .toQuery()
      if (colName) {
        const conflictUpdateFields = Object.keys(batch[0])
          .map(key => `"${key}" = EXCLUDED."${key}"`)
          .join(', ')

        const onConflictUpdateQuery = `${insertQuery} ON CONFLICT (${colName}) DO UPDATE SET ${conflictUpdateFields}`
        await trx.raw(onConflictUpdateQuery)
      } else {
        await trx.raw(insertQuery)
      }
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
