export function tryParseNumber(val: string): string | number {
  const num = Number(val)
  return Number.isNaN(num) ? val : num
}
