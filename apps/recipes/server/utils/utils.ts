import type { Knex } from 'knex'

export interface OnConflictOptions {
  action?: 'ignore' | 'merge'
  columns?: string[]
}

export async function batchInsert(knex: Knex, data: any[], batchSize: number, tableName: string, columnsOrOptions?: string[] | OnConflictOptions) {
  const totalRows = data.length
  const numBatches = Math.ceil(totalRows / batchSize)
  const options: OnConflictOptions = columnsOrOptions && Array.isArray(columnsOrOptions)
    ? { action: 'merge', columns: columnsOrOptions }
    : columnsOrOptions || {}

  await useTransaction(knex, async (trx: Knex) => {
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize
      const end = Math.min((i + 1) * batchSize, totalRows)
      const batch = data.slice(start, end)

      const query = trx(tableName).insert(batch)
      if (options.columns && options.columns.length > 0) {
        if (options.action === 'ignore') {
          query.onConflict(options.columns).ignore()
        } else {
          query.onConflict(options.columns).merge()
        }
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
