export function isSQLError(error: any, errorCode: number): boolean {
  if (error instanceof AggregateError)
    return false
  return error?.number === errorCode
}
