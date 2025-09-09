import type { Knex } from 'knex'

export function getMaxBatchSize(records: Record<string, unknown>[]): number {
  // mssql supports a max of 2100 parameters in one statement
  // I actually had trouble using the full 2100 on an old SQL 2008 R2 server.
  // I think it must reserve a few internally for return values or something, hence the minus 10.
  const maxDBParameters = 2100 - 10
  // get a set of all column names, across all the records
  const uniqueKeySet = records
    .reduce((uniqueKeySet, currentRecord) => {
      Object
        .keys(currentRecord)
        .forEach(key => uniqueKeySet.add(key))
      return uniqueKeySet
    }, new Set())
  return Math.floor(maxDBParameters / uniqueKeySet.size)
}

export function chunks<T extends Record<string, unknown>>(
  records: T[],
  batchSize: number,
): T[][] {
  const result: T[][] = []
  for (let i = 0; i < records.length; i += batchSize) {
    result.push(records.slice(i, i + batchSize))
  }
  return result
}

// TODO: Move these to standard `@teleskop/utils` package
export async function insertBatch<T extends Record<string | number | symbol, unknown>>(
  knex: Knex,
  tableName: string,
  records: T[],
): Promise<void> {
  if (records.length === 0)
    return Promise.resolve()
  const chunkedRecords = chunks(records, getMaxBatchSize(records))
  for (const chunk of chunkedRecords) {
    await knex(tableName).insert(chunk)
  }
}
