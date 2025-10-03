export const MSSQL_ERROR = {
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
  cause?: MssqlError
  constructor(message: string, options?: { cause?: MssqlError }) {
    super(message)
    this.name = 'DatabaseQueryError'
    this.cause = options?.cause
  }
}
