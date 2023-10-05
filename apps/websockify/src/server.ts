/* eslint-disable node/no-deprecated-api */
import { randomInt } from 'node:crypto'
import { createConnection } from 'node:net'
import { setTimeout as wait } from 'node:timers/promises'
import type { Buffer } from 'node:buffer'
import { parse as parseURL } from 'node:url'
import process from 'node:process'
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'
import type { Machine } from './database'
import { fetchTeleskopMachine } from './database'
import { getEnv } from './helpers'
import type { NsLogger } from './logger'
import { createLogger } from './logger'

const {
  SERVER_HOST = '0.0.0.0',
  SERVER_PORT = '6800',
  TARGET_HOST,
  TARGET_PORT = '5900',
} = getEnv(process.env)

const MAX_RETRIES = 5
const RETRY_INTERVAL = 1000
const HEARTBEAT_INTERVAL = 30000
const CONNECTION_TIMEOUT = 10000

const logger = createLogger('server')

if (process.env.NODE_ENV === 'development' && TARGET_HOST) {
  logger.info(`TARGET_HOST defined, requests will be forwarded to ${TARGET_HOST}`)
}

const wss = new WebSocketServer({
  host: SERVER_HOST,
  port: Number.parseInt(SERVER_PORT),
})

// Heartbeat Monitor
const monitor = setInterval(() => {
  (wss.clients as Set<WebSocket & { isAlive: boolean }>).forEach((ws) => {
    if (!ws.isAlive) {
      ws.terminate()
    } else {
      ws.isAlive = true
      ws.ping()
    }
  })
}, HEARTBEAT_INTERVAL)

wss.on('listening', () => {
  logger.info(`WebSocketServer listening ${SERVER_PORT}`)
})

wss.on('error', (err) => {
  logger.error(`WebSocketServer error: ${err.message}`)
})

wss.on('close', () => {
  clearInterval(monitor)
})

const expectedPathPattern = /^\/\d+$/

wss.on('connection', async (client: WebSocket & { isAlive: boolean }, request) => {
  client.isAlive = true
  client.on('pong', () => {
    client.isAlive = true
  })

  const namespace = randomInt(0x10000, 0xFFFFF).toString(16)
  const { pathname } = parseURL(request.url || '')
  const logger = createLogger(namespace)

  logger.info('Client connected')

  /**
   * Terminate socket connection with code 1008.
   *
   * RFC: https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1
   */
  const close = (msg: string) => {
    logger.debug(`Terminated client before proxy stream started. Reason: ${msg}`)
    client.close(1008, msg)
  }

  let machine: Machine | null = null

  if (process.env.NODE_ENV === 'production' || !TARGET_HOST) {
    if (!pathname || pathname === '/')
      return close('Expected machine id')
    if (!expectedPathPattern.test(pathname))
      return close('Invalid machine id')

    const id = Number.parseInt(pathname.slice(1))
    machine = await fetchTeleskopMachine(id)

    if (!machine)
      return close(`Machine with id ${id} is not found`)
  } else {
    machine = {
      name: 'DEV',
      host: TARGET_HOST,
      port: Number.parseInt(TARGET_PORT),
    }
  }

  createProxyStream(machine, client, logger)
})

function createProxyStream(machine: Machine, client: WebSocket, logger: NsLogger) {
  logger.info(`Client requested to connect to machine '${machine.name}' at '${machine.host}:${machine.port}'`)

  const server = createConnection({
    host: machine.host,
    port: machine.port,
  })
  /** Retry counter for connection errors */
  let retries = 0

  const timeout = setTimeout(() => {
    logger.error(`Failed to connect in ${CONNECTION_TIMEOUT}ms`)
    server.end()
    client.close()
  }, CONNECTION_TIMEOUT)

  server.on('connect', () => {
    retries = 0
    clearTimeout(timeout)
    logger.info('Connected to target server')
  })

  server.on('data', (data) => {
    try {
      client.send(data)
    } catch {
      logger.debug('Client closed connection, closing server connection')
      server.end()
    }
  })

  server.on('error', async (err) => {
    logger.error(`Server connection error: ${err.message}`)
    if (retries < MAX_RETRIES) {
      retries++
      logger.info(`Re-connecting. Retry: ${retries} / ${MAX_RETRIES}`)
      await wait(RETRY_INTERVAL)
      server.connect({
        host: machine.host,
        port: machine.port,
      })
    } else {
      client.close(1011, `Connection to ${machine.name} failed after ${MAX_RETRIES}. ${err.message}`)
    }
  })

  server.on('end', () => {
    clearTimeout(timeout)
    logger.info('Server connection closed')
    client.close()
  })

  client.on('message', (data) => {
    try {
      server.write(data as Buffer)
    } catch {
      logger.debug('Server closed connection, closing client connection')
      client.close()
    }
  })

  client.on('error', (err) => {
    logger.error(`Client connection error: ${err.message}`)
    client.close()
    server.end()
  })

  client.on('close', () => {
    clearTimeout(timeout)
    logger.info('Client connection closed')
    server.end()
  })
}
