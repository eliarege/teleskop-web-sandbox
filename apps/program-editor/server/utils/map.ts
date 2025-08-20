export function mapObject<
  T extends Record<string, any>,
  M extends Partial<Record<keyof T, string>>,
>(object: T, mapping: M): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, column] of Object.entries(mapping)) {
    if (!column)
      continue

    const value = object[key as keyof T]
    if (value !== undefined) {
      result[column] = value
    }
  }

  return result
}
