export function isDef<T>(value: T): value is Exclude<T, undefined> {
  return typeof value !== 'undefined'
}

interface CachedValue<T> {
  value: T
  expiresAt: number
}

export function memoize<Args extends any[], ReturnValue>(
  fn: (...args: Args) => ReturnValue,
  options?: {
    cacheKey?: (...args: Args) => string
    maxAge?: number
  },
): (...args: Args) => ReturnValue {
  const cache = new Map<string, CachedValue<ReturnValue>>()
  const maxAge = options?.maxAge || 10_000
  const cacheKeyFn = options?.cacheKey || (() => '')
  return (...args: Args) => {
    const currentTimestamp = Date.now()
    const cacheKey = cacheKeyFn(...args)
    const cachedValue = cache.get(cacheKey)
    const cacheExpired = cachedValue && cachedValue.expiresAt <= currentTimestamp
    if (cachedValue && !cacheExpired) {
      return cachedValue.value
    } else {
      if (cacheExpired) {
        cache.delete(cacheKey)
      }
      const output = fn(...args)
      if (output instanceof Promise) {
        return output.then((value) => {
          cache.set(cacheKey, {
            value,
            expiresAt: currentTimestamp + maxAge,
          })
          return value
        }) as ReturnValue
      } else {
        cache.set(cacheKey, {
          value: output,
          expiresAt: currentTimestamp + maxAge,
        })
        return output
      }
    }
  }
}
