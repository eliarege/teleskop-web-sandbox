const PART_COUNT_COLUMN_REGEX = /^Parameter([1-9]|[1-4][0-9]|50)$/

export function isValidPartCountColumn(value: string): boolean {
  return PART_COUNT_COLUMN_REGEX.test(value)
}
