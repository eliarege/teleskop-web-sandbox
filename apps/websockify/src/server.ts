import { createConnection } from 'node:net'
import { setTimeout as wait } from 'node:timers/promises'
import type { Buffer } from 'node:buffer'
import process from 'node:process'
import type { IncomingMessage } from 'node:http'
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'
import type { Logger } from 'pino'
import type { Machine } from './database'
import { fetchDMSMachine, fetchTeleskopMachine } from './database'
import { getPathname, onExitSignal } from './utils'
import { logger as parentLogger } from './logger'
import { initKcAuth } from './auth'
import { ClientMessageType, ProxyHandshake, interceptClientMessageType } from './rfb'
import { config } from './config'

interface WebSocketExt extends WebSocket {
  isAlive: boolean
}

const MAX_RETRIES = 5
const RETRY_INTERVAL = 1000
const HEARTBEAT_INTERVAL = 30000
const CONNECTION_TIMEOUT = 10000

const VNC_VIEW_ROLE = 'vnc-view'
const VNC_INPUT_ROLE = 'vnc-input'

const MACHINE_PATH_RE = /^\/\d+$/
const DISPENSER_PATH_RE = /^\/dispenser\/\d+$/

const kcAuth = initKcAuth()
const logger = parentLogger.child({ name: 'server' })

if (process.env.NODE_ENV === 'development' && config.targetHost) {
  logger.info(`TARGET_HOST defined, requests will be forwarded to ${config.targetHost}`)
  if (!config.targetPassword) {
    logger.error(`TARGET_PASSWORD is not defined. Exiting..`)
    process.exit(1)
  }
}

const wss = new WebSocketServer({
  host: config.serverHost,
  port: config.serverPort,
})

// Heartbeat Monitor
const monitor = setInterval(() => {
  (wss.clients as Set<WebSocketExt>).forEach((ws) => {
    if (!ws.isAlive) {
      ws.terminate()
    } else {
      ws.isAlive = false
      ws.ping()
    }
  })
}, HEARTBEAT_INTERVAL)

wss.on('listening', () => {
  logger.info(`WebSocketServer listening ${config.serverHost}:${config.serverPort}`)
})

wss.on('error', (err) => {
  logger.error(`WebSocketServer error: ${err.message}`)
})

wss.on('close', () => {
  clearInterval(monitor)
})

// When authenticated client connects via WebSocket
wss.on('connection', async (client: WebSocketExt, request: IncomingMessage) => {
  client.isAlive = true
  client.on('pong', () => {
    client.isAlive = true
  })
  let logger = parentLogger.child({ name: 'user.anonymous' })
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

  let viewOnly = false

  if (kcAuth.enabled) {
    const result = await kcAuth.authenticate(client)
    if (result.status === 'error') {
      logger.debug('Client failed security challenge')
      return close(result.reason.message)
    } else {
      const { payload } = result
      logger = parentLogger.child({ name: `user.${payload.name}` })
      logger.info('Client authenticated')
      logger.debug(`Client roles: %o`, payload.roles)

      if (!payload.roles.includes(VNC_VIEW_ROLE)) {
        logger.debug('Client unauthorized')
        return close('Unauthorized')
      }

      viewOnly = !payload.roles.includes(VNC_INPUT_ROLE)
      client.send(JSON.stringify({ viewOnly }))
    }
  }

  let machine: Machine | null = null

  const pathname = getPathname(request)
  if (process.env.NODE_ENV === 'production' || !config.targetHost) {
    if (!pathname || pathname === '/')
      return close('Expected machine id')
    const isDMS = DISPENSER_PATH_RE.test(pathname)
    if (!MACHINE_PATH_RE.test(pathname) && !isDMS)
      return close('Invalid machine id')
    const id = Number.parseInt(pathname.slice(isDMS ? '/dispenser/'.length : 1))
    machine = isDMS ? await fetchDMSMachine(id) : await fetchTeleskopMachine(id)
    if (!machine)
      return close(`Machine with id ${id} is not found`)
  } else {
    machine = {
      name: 'DEV',
      host: config.targetHost,
      port: config.targetPort,
      password: config.targetPassword!,
    }
  }

  createProxyStream(machine, client, logger, viewOnly)
})

function createProxyStream(machine: Machine, client: WebSocket, logger: Logger, viewOnly: boolean) {
  logger.info(`Client requested to connect to machine '${machine.name}' at '${machine.host}:${machine.port}'`)

  const server = createConnection({
    host: machine.host,
    port: machine.port,
  })
  const controller = new AbortController()
  const proxy = new ProxyHandshake(client, server, machine, controller.signal, logger)

  /** Retry counter for connection errors */
  let retries = 0
  let handshaking = true

  const cleanup = () => {
    controller.abort()
    client.close()
    server.end()
  }

  proxy.handshake()
    .then((success) => {
      if (success) {
        handshaking = false
      } else {
        // Let server/client close the connection
      }
    })
    .catch((err) => {
      logger.error(err, 'Error during handshake')
      cleanup()
    })

  const timeout = setTimeout(() => {
    logger.error(`Failed to connect in ${CONNECTION_TIMEOUT}ms`)
    cleanup()
  }, CONNECTION_TIMEOUT)

  server.on('connect', () => {
    retries = 0
    clearTimeout(timeout)
    logger.info('Connected to target server')
  })

  // Intercept server messages
  server.on('data', (data: Buffer) => {
    if (!handshaking) {
      client.send(data)
    }
  })

  // Intercept Client Messages
  client.on('message', (data: Buffer) => {
    if (!handshaking) {
      if (viewOnly) {
        const type = interceptClientMessageType(data)
        // Filter out key and pointer events if client is view only
        if (type === ClientMessageType.KeyEvent || type === ClientMessageType.PointerEvent) {
          return
        }
      }
      server.write(data)
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
    cleanup()
    logger.info('Server connection closed')
  })

  client.on('error', (err) => {
    logger.error(`Client connection error: ${err.message}`)
    cleanup()
  })

  client.on('close', () => {
    clearTimeout(timeout)
    cleanup()
    logger.info('Client connection closed')
  })
}

onExitSignal(() => {
  wss.clients.forEach(c => c.terminate())
  wss.close()
  process.exit(0)
})
