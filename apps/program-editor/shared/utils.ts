export const as = <T>(value: T) => value as T

export const isDef = <T = any>(val?: T): val is T => typeof val !== 'undefined'

export function capitalize<T extends string>(string: T): Capitalize<T> {
  return string[0].toUpperCase() + string.slice(1) as Capitalize<T>
}

export function groupBy<T>(collection: T[], callback: (item: T) => string | number): Record<string | number, T[]> {
  return collection.reduce((groups, item) => {
    const key = callback(item)
    groups[key] = groups[key] || []
    groups[key].push(item)
    return groups
  }, {} as Record<string | number, T[]>)
}

export function groupByMap<K, V>(collection: V[], callback: (item: V) => K): Map<K, V[]> {
  return collection.reduce((groups, item) => {
    const key = callback(item)
    if (groups.has(key)) {
      groups.get(key)!.push(item)
    } else {
      groups.set(key, [item])
    }
    return groups
  }, new Map<K, V[]>())
}

export function skipLine(it: IterableIterator<string>): void {
  it.next()
}

/** Reads next line, throws if EOF or does not match pattern. */
export function readLineStrict(it: IterableIterator<string>, pattern: RegExp | string): RegExpMatchArray {
  const line = it.next()
  if (line.done)
    throw new Error('Unexpected end of iterator')

  if (typeof pattern === 'string') {
    if (pattern !== line.value)
      throw new Error(`Unexpected line. Expected: ${pattern}, received: ${line.value}`)

    return [line.value]
  } else {
    const match = line.value.match(pattern)
    if (!match)
      throw new Error(`Unexpected line. Expected pattern: ${pattern}, received: ${line.value}`)

    return match
  }
}

export function isUint(value: number): boolean {
  return !Number.isNaN(value) && value >= 0 && (value % 1 === 0)
}

export function measure<Fn extends (...args: any[]) => any>(cb: Fn): Fn {
  return ((...args: any[]): any => {
    const start = new Date().getTime()
    cb(...args)
    const end = new Date().getTime()
    console.log(`${cb.name} took ${end - start}ms`)
  }) as Fn
}

export const contextMenuStore = useContextMenuStore()
