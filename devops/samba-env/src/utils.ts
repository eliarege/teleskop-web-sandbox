type MapWithValue<T extends Record<string, any>, V> = {
  [K in keyof T]: V
}

export function filter<T extends Record<string, any>>(object: T, callback: (value: T[keyof T], key: string) => boolean): Partial<T> {
  const result = {} as Record<string, any>
  for (const [key, value] of Object.entries(object)) {
    if (callback(value, key)) {
      result[key] = value
    }
  }
  return result as Partial<T>
}

export function mapValues<T extends Record<string, any>, V>(object: T, callback: (value: T[keyof T], key: string) => V): MapWithValue<T, V> {
  const result = {} as Record<string, any>
  for (const [key, value] of Object.entries(object)) {
    result[key] = callback(value, key)
  }
  return result as MapWithValue<T, V>
}
