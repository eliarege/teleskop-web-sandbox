import { Knex } from 'knex'

export const MSSQL_ERROR_CODE = {
  SQ_BADCOL: 207,
} as const

export interface MssqlError extends Error {
  /** The error number, see https://docs.microsoft.com/en-us/sql/relational-databases/errors-events/database-engine-events-and-errors */
  number: number
  class: number
  state: number
  serverName: string
  procName: string
  lineNumber: number
}

export class DatabaseQueryError extends Error {
  cause?: AggregateError | MssqlError
  constructor(message: string, options?: { cause?: AggregateError | MssqlError }) {
    super(message)
    this.name = 'DatabaseQueryError'
    this.cause = options?.cause
  }

  getMssqlErrors(): MssqlError[] {
    if (this.cause instanceof AggregateError) {
      return this.cause.errors.filter((err): err is MssqlError => (err as MssqlError).number !== undefined)
    } else if (this.cause && (this.cause as MssqlError).number !== undefined) {
      return [this.cause as MssqlError]
    } else {
      return []
    }
  }
}

export class UnsupportedDatabaseVersionError extends Error {
  constructor(
    public expectedVersion: string,
    public actualVersion: string,
  ) {
    super(`Unsupported database version: expected ${expectedVersion}, but got ${actualVersion}`)
    this.name = 'UnsupportedDatabaseVersionError'
  }
}

export function inferInvalidColumnError(errorMsg: string): string | null {
  const match = errorMsg.match(/'([^']+)'/)
  return match ? match[1] : null
}
