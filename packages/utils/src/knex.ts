import type { Knex } from 'knex'
import { chunks, isDef } from './base'

// Should mirror `FilterableTableFilter` from `nuxt-base/types`
interface Filter {
  label: string
  field: string
  isOrderFilter?: boolean
  filterType: string
  optionValue?: string
  value: {
    option?: Array<any>
    from?: Date
    to?: Date
    min?: number
    max?: number
    operator?: string
    number?: number
    direction?: string
  }
}

// TODO: Knex should be the first parameter and make function name operateFiltersOnKnexQuery or smt better
export function filtersToKnex(filters: Filter[], attributes: any, knexInstance: Knex.QueryBuilder) {
  // TODO: knexInstance içine bak belki select parameters knex objenin içerisinden alınıyordur
  return knexInstance
    .where((builder) => {
      filters.forEach((filter) => {
        const attName = filter.optionValue ? filter.optionValue : filter.field
        const DBName = attributes[attName]
        if (filter.isOrderFilter) {
          // Ordering is an optional for backend. Its not implemented right now.
        } else if (filter.filterType === 'select' || filter.filterType === 'multiselect') {
          builder.andWhere((innerBuilder) => {
            filter.value.option?.forEach((opt) => {
              innerBuilder.orWhere(DBName, '=', opt[attName])
            })
          })
        } else if (filter.filterType === 'comparison') {
          if (isDef(filter.value.max) && isDef(filter.value.min)) {
            builder.andWhere(DBName, '<', filter.value.max)
            builder.andWhere(DBName, '>=', filter.value.min)
          } else if (isDef(filter.value.number) && filter.value.operator) {
            builder.andWhere(DBName, filter.value.operator, filter.value.number)
          }
        } else if (filter.filterType === 'date') {
          if (isDef(filter.value.to))
            builder.andWhere(DBName, '<', filter.value.to)
          if (isDef(filter.value.from))
            builder.andWhere(DBName, '>=', filter.value.from)
        } else if (filter.filterType === 'boolean' && isDef(filter.value.option)) {
          builder.andWhere(DBName, filter.value.option[0])
        } else if (filter.filterType === 'includes') {
          builder.andWhere(DBName, 'like', `%${filter.value}%`)
        } else if (filter.filterType === 'equals') {
          builder.andWhere(DBName, `${filter.value}`)
        }
      })
    })
}

/** Gets the maximum batch size for inserting records into the database */
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

/** Inserts a batch of records into the specified table in chunks. (Based on MSSQL limitations) */
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

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

function assertIdentifier(name: string): void {
  if (!IDENTIFIER_RE.test(name))
    throw new Error(`Invalid SQL identifier: ${name}`)
}

/**
 * Updates a batch of records in the specified table in chunks. (Based on MSSQL limitations)
 *
 * Builds a `CASE`-based `UPDATE` keyed by `keyColumns`, so each record can target
 * a different row while collapsing N round-trips into a few chunked statements.
 */
export async function updateBatch<T extends Record<string | number | symbol, unknown>>(
  knex: Knex,
  tableName: string,
  records: T[],
  keyColumns: string[],
  updateColumns: string[],
): Promise<void> {
  if (records.length === 0)
    return

  assertIdentifier(tableName)
  keyColumns.forEach(assertIdentifier)
  updateColumns.forEach(assertIdentifier)

  const paramsPerRow = updateColumns.length * (keyColumns.length + 1) + keyColumns.length
  const maxBatchSize = Math.max(1, Math.floor((2100 - 10) / paramsPerRow))

  console.log(`Updating ${records.length} records in ${tableName} in batches of ${maxBatchSize}...`)

  for (const batch of chunks(records, maxBatchSize)) {
    const bindings: unknown[] = []

    const setClauses = updateColumns.map((col) => {
      const whens = batch.map((rec) => {
        const conds = keyColumns.map(k => `${k} = ?`).join(' AND ')
        keyColumns.forEach(k => bindings.push(rec[k]))
        bindings.push(rec[col])
        return `WHEN ${conds} THEN ?`
      })
      return `${col} = CASE ${whens.join(' ')} END`
    })

    const whereClauses = batch.map((rec) => {
      const conds = keyColumns.map(k => `${k} = ?`).join(' AND ')
      keyColumns.forEach(k => bindings.push(rec[k]))
      return `(${conds})`
    })

    const sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' OR ')}`
    await knex.raw(sql, bindings)
    console.log(`Updated ${batch.length} records in ${tableName}.`)
  }
}
