import type { IncomingMessage } from 'node:http'
import process from 'node:process'

export { inferBoolean } from 'utils'

/**
 * Makes it possible to safely destruct properties with defaults.
 * @example
 * // Default value will only be applied if process.env.PORT is undefined
 * const { PORT = '8080' } = process.env
 *
 * // Safely extracts PORT variable and applies defaults if its falsy
 * const { PORT = '8080' } = destruct(process.env)
 *
 */
export function destruct<T extends Record<string, any>>(object: T): T {
  return new Proxy(object, {
    get(target, key: string) {
      if (target[key]) {
        return target[key]
      } else {
        return undefined
      }
    },
  })
}

export function getEnvOrThrow(name: keyof NodeJS.ProcessEnv): string {
  const env = process.env[name]
  if (!env)
    throw new Error(`${name} should be defined`)
  return env
}

const PATH_RE = /^[^#?]+/

export function getPathname(request: IncomingMessage) {
  if (!request.url)
    return ''
  return request.url.match(PATH_RE)?.[0] || ''
}

/** When exit signal is received. It is the responsibility of the callback to handle process exit. */
export function onExitSignal(callback: () => void) {
  process.on('SIGINT', callback)
  process.on('SIGTERM', callback)
}
