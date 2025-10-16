interface MssqlError extends Error {
  number: number
}

export const PRIMARY_KEY_VIOLATION = 2627

export function isMssqlError(error: unknown, code: number): boolean {
  if (error instanceof AggregateError) {
    return error.errors.some(e => isMssqlError(e, code))
  } else if (error instanceof Error) {
    return (error as MssqlError).number === code
  } else {
    return false
  }
}
