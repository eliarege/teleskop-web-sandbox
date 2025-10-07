export function isSQLError(error: unknown, errorCode: number): boolean {
  if (error instanceof AggregateError) {
    return error.errors?.some(e => (e as any)?.number === errorCode) ?? false
  }
  return (error as any)?.number === errorCode
}

export const MSSQL_ERROR = {
  FOREIGN_KEY_VIOLATION: 547,
  PRIMARY_KEY_VIOLATION: 2627,
  UNIQUE_INDEX_VIOLATION: 2601,
} as const
