import { createConnection } from 'node:net'
import { setTimeout as wait } from 'node:timers/promises'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import type { IncomingMessage } from 'node:http'
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'
import type { Logger } from 'pino'
import type { Machine } from './database'
import { fetchTeleskopMachine } from './database'
import { getPathname, onExitSignal } from './utils'
import { logger as parentLogger } from './logger'
import { DESECBCipher } from './crypto/des'
import { initKcAuth } from './auth'
import { ClientMessageType, HandshakeError, HandshakeState, createRFBHandshakeProxy, interceptClientMessageType } from './rfb'
import { config } from './config'

interface WebSocketExt extends WebSocket {
  isAlive: boolean
}

const MAX_RETRIES = 5
const RETRY_INTERVAL = 1000
const HEARTBEAT_INTERVAL = 30000
const CONNECTION_TIMEOUT = 10000
const TBB_VNC_PASSWORD = '123456'

const VNC_VIEW_ROLE = 'vnc-view'
const VNC_INPUT_ROLE = 'vnc-input'

const MACHINE_PATH_RE = /^\/\d+$/

const kcAuth = initKcAuth()
const logger = parentLogger.child({ name: 'server' })

if (process.env.NODE_ENV === 'development' && config.targetHost) {
  logger.info(`TARGET_HOST defined, requests will be forwarded to ${config.targetHost}`)
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

  const pathname = getPathname(request)
  let machine: Machine | null = null

  if (process.env.NODE_ENV === 'production' || !config.targetHost) {
    if (!pathname || pathname === '/')
      return close('Expected machine id')
    if (!MACHINE_PATH_RE.test(pathname))
      return close('Invalid machine id')

    const id = Number.parseInt(pathname.slice(1))
    machine = await fetchTeleskopMachine(id)

    if (!machine)
      return close(`Machine with id ${id} is not found`)
  } else {
    machine = {
      name: 'DEV',
      host: config.targetHost,
      port: config.targetPort,
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
  const proxy = createRFBHandshakeProxy()
  // The argument passed to the first next() call cannot be retrieved because there's no currently suspended yield.
  // So we need to call next() once before initiating the handshake
  // Read more: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield
  proxy.next()

  let hsInProgress = true
  let hsSuccess = false
  let hsNextState = HandshakeState.ProtocolVersionServer
  let hsChallenge: Buffer | null = null

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

  // Intercept server messages
  server.on('data', (data: Buffer) => {
    try {
      if (hsInProgress) {
        // Server finalizes handshakes, so we check if iterator is done
        const result = proxy.next({ type: 'server', data })
        if (result.done) {
          hsInProgress = false
          hsSuccess = result.value
        } else {
          hsNextState = result.value
          if (hsNextState === HandshakeState.AuthenticationClient) {
            hsChallenge = data
          }
        }
      }
      client.send(data)
    } catch (err) {
      if (err instanceof HandshakeError) {
        logger.error(err, 'Error during handshake:')
      } else {
        logger.debug('Client closed connection, closing server connection')
      }
      server.end()
    }
  })

  // Intercept Client Messages
  client.on('message', (data: Buffer) => {
    try {
      if (hsInProgress) {
        const prevState = hsNextState
        // Client never finalizes handshake so we can safely assume iterator is `done` yet
        hsNextState = proxy.next({ type: 'client', data }).value as HandshakeState
        // Solve authentication challenge
        if (prevState === HandshakeState.AuthenticationClient && hsChallenge) {
          const cipher = DESECBCipher.importKey(Buffer.from(TBB_VNC_PASSWORD))
          const result = cipher.encrypt(hsChallenge)
          server.write(result || data)
        } else {
          server.write(data)
        }
      } else if (hsSuccess) {
        // Filter out key and pointer events if client is view only
        if (viewOnly) {
          const type = interceptClientMessageType(data)
          if (type === ClientMessageType.KeyEvent || type === ClientMessageType.PointerEvent) {
            return
          }
        }
        server.write(data)
      }
    } catch (err) {
      if (err instanceof HandshakeError) {
        logger.error(err, 'Error during handshake:')
      } else {
        logger.debug('Server closed connection, closing client connection')
      }
      client.close()
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

onExitSignal(() => {
  wss.close()
})
