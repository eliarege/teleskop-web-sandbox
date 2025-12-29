export interface KeyValueRepository<TDefault = unknown> {
  get: <T = TDefault>(key: string) => Promise<T | null>
  set: <T = TDefault>(key: string, value: T, ttlSeconds?: number) => Promise<void>
  delete: (key: string) => Promise<void>
}

export interface InMemoryKeyValueRepositoryOptions {
  /**
   * Interval to clean up expired keys from the in-memory store in milliseconds.
   * Default is 60000 ms (1 minute).
   */
  cleanupInterval?: number
}

export class InMemoryKeyValueRepository<TDefault = unknown> implements KeyValueRepository<TDefault> {
  private store = new Map<string, { value: string, expiresAt: number | null }>()

  constructor(options?: InMemoryKeyValueRepositoryOptions) {
    const cleanupInterval = options?.cleanupInterval ?? 60 * 1000

    setInterval(() => this.cleanup(), cleanupInterval).unref()
  }

  async get<T = TDefault>(key: string): Promise<T | null> {
    const value = this.store.get(key)
    if (value) {
      if (value.expiresAt && Date.now() > value.expiresAt) {
        this.store.delete(key)
        return null
      }
      return JSON.parse(value.value) as T
    }
    return null
  }

  async set<T = TDefault>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const stringValue = JSON.stringify(value)
    this.store.set(key, {
      value: stringValue,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, { expiresAt }] of this.store.entries()) {
      if (expiresAt && now > expiresAt) {
        this.store.delete(key)
      }
    }
  }
}
