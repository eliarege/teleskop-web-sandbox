import { type LoggerOptions, pino } from 'pino'
import type { PrettyOptions } from 'pino-pretty'
import type { H3Event } from 'h3'

const config = useRuntimeConfig()

const loggerOptions: LoggerOptions = {
  level: config.logLevel || 'info',
}

if (import.meta.dev) {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      ignore: 'pid,hostname',
    } as PrettyOptions,
  }
}

const logger = pino(loggerOptions)

export function useLogger(event?: H3Event) {
  const user = event?.context.kauth?.preferred_username
  const bindings: Record<string, any> = {}
  if (user)
    bindings.user = user

  return logger.child(bindings)
}
