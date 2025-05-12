import type { IncomingMessage } from 'node:http'

export function getRawQueryString(req: IncomingMessage) {
  if (!req.url)
    return ''
  const url = new URL(req.url, 'http://localhost')
  return url.search
}

export function withTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`
}

export function pMemoize<T extends (...args: any[]) => any>(
  fn: T,
  ttlSeconds: number,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let cache: ReturnType<T> | null = null
  let expiresAt = 0

  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const now = Date.now()
    if (now < expiresAt && cache !== null) {
      return cache
    }

    cache = await fn(...args)
    expiresAt = now + ttlSeconds * 1000
    return cache!
  }
}
