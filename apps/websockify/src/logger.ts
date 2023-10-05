import process from 'node:process'
import type { Logger } from 'pino'
import Pino from 'pino'

const pino = Pino({
  level: process.env.LOG_LEVEL || 'info',
})

// Wrapper around pino
export class NsLogger {
  readonly namespace: string
  readonly pino: Logger

  constructor(namespace: string) {
    this.namespace = namespace
    this.pino = pino
  }

  debug(msg: string) {
    pino.debug(`[${this.namespace}] ${msg}`)
  }

  info(msg: string) {
    pino.info(`[${this.namespace}] ${msg}`)
  }

  warn(msg: string) {
    pino.warn(`[${this.namespace}] ${msg}`)
  }

  error(msg: string) {
    pino.error(`[${this.namespace}] ${msg}`)
  }
}

/** Create namespaced pino logger. */
export function createLogger(namespace: string) {
  return new NsLogger(namespace)
}
