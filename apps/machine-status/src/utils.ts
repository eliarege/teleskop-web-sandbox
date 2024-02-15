export function isDef<T>(value: T): value is Exclude<T, undefined> {
  return typeof value !== 'undefined'
}

export function memoize<Args extends any[], ReturnValue>(
  fn: (...args: Args) => ReturnValue,
  options?: {
    cacheKey?: (...args: Args) => string
    maxAge?: number
  },
): (...args: Args) => ReturnValue {
  const cache = new Map<string, ReturnValue>()
  const maxAge = options?.maxAge
  const cacheKeyFn = options?.cacheKey || (() => '')

  if (maxAge === 0) {
    return fn
  }
  if (maxAge) {
    const maxSetIntervalValue = 2_147_483_6477
    if (typeof maxAge !== 'number') {
      throw new TypeError(`maxAge should be a number`)
    }
    if (maxAge > maxSetIntervalValue) {
      throw new TypeError(`maxAge cannot exceed ${maxSetIntervalValue}`)
    }
    if (maxAge < 0) {
      throw new TypeError('maxAge should not be a negative number')
    }
  }

  return function (this: any, ...args: Args) {
    const cacheKey = cacheKeyFn(...args)
    const cachedValue = cache.get(cacheKey)
    if (cachedValue) {
      return cachedValue
    }

    const result = fn.apply(this, args)
    if (result instanceof Promise) {
      return result.then((_result) => {
        cache.set(cacheKey, _result)
        if (maxAge) {
          const timer = setTimeout(() => {
            cache.delete(cacheKey)
          }, maxAge)
          timer.unref()
        }
        return _result
      }) as ReturnValue
    } else {
      cache.set(cacheKey, result)
      if (maxAge) {
        const timer = setTimeout(() => {
          cache.delete(cacheKey)
        }, maxAge)
        timer.unref()
      }
      return result
    }
  }
}
