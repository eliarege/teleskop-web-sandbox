export function isSQLError(error: unknown, errorCode: number): boolean {
  if (error instanceof AggregateError) {
    return error.errors?.some(e => (e as any)?.number === errorCode) ?? false;
  }
  return (error as any)?.number === errorCode;
}