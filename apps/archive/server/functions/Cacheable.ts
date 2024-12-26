type FetchFunction<T> = () => Promise<T>

interface CacheableOptions {
  maxAge?: number
}

export class Cacheable<T> {
  private fetchFn: FetchFunction<T>
  private maxAge: number
  private cache: T | null = null
  private lastFetched: number | null = null
  private isFetching: boolean = false
  private _waiters: ((error?: any) => void)[] = []

  constructor(fetchFn: FetchFunction<T>, options: CacheableOptions = {}) {
    if (typeof fetchFn !== 'function') {
      throw new TypeError('fetchFn must be a function')
    }

    this.fetchFn = fetchFn
    this.maxAge = options.maxAge || 60_000
  }

  async get(): Promise<T> {
    const now = Date.now()

    // Check if the cached value is still valid
    if (this.cache !== null && this.lastFetched !== null && now - this.lastFetched < this.maxAge) {
      return this.cache
    }

    // Avoid duplicate fetches if another call is already fetching
    if (this.isFetching) {
      await this._waitForFetch()
      return this.cache as T
    }

    return this._fetchAndCache()
  }

  private async _fetchAndCache(): Promise<T> {
    this.isFetching = true

    try {
      const result = await this.fetchFn()
      this.cache = result
      this.lastFetched = Date.now()
      this._resolveWaiters()
      return result
    } catch (error) {
      this._resolveWaiters(error)
      throw error
    } finally {
      this.isFetching = false
    }
  }

  private _waitForFetch(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._waiters.push((error?: any) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  private _resolveWaiters(error?: any): void {
    this._waiters.forEach(resolve => resolve(error))
    this._waiters = []
  }

  dispose(): void {
    this.cache = null
    this.lastFetched = null
  }
}
