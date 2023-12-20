import { createConnection } from 'node:net'
import { setTimeout as wait } from 'node:timers/promises'
import type { Buffer } from 'node:buffer'
import process from 'node:process'
import type { IncomingMessage } from 'node:http'
import { createServer } from 'node:http'
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'
import type { Logger } from 'pino'
import type { Machine } from './database'
import { fetchTeleskopMachine } from './database'
import { destruct, getPathname } from './utils'
import { logger as parentLogger } from './logger'
import type { AuthPayload } from './auth'
import { initAuth } from './auth'
import { ClientMessageType, HandshakeError, MessageType, createRFBHandshakeProxy, interceptClientMessageType } from './rfb'

const {
  SERVER_HOST = '0.0.0.0',
  SERVER_PORT = '6800',
  TARGET_HOST,
  TARGET_PORT = '5900',
} = destruct(process.env)

const MAX_RETRIES = 5
const RETRY_INTERVAL = 1000
const HEARTBEAT_INTERVAL = 30000
const CONNECTION_TIMEOUT = 10000

const VNC_READ_ROLE = 'vnc-view'
const VNC_INPUT_ROLE = 'vnc-input'

const MACHINE_PATH_RE = /^\/\d+$/

const auth = initAuth()
const logger = parentLogger.child({ name: 'server' })

if (process.env.NODE_ENV === 'development' && TARGET_HOST) {
  logger.info(`TARGET_HOST defined, requests will be forwarded to ${TARGET_HOST}`)
}

const server = createServer()
const wss = new WebSocketServer({
  noServer: true,
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

// Protocol Upgrade and Client Authorization
server.on('upgrade', async (request, socket, head) => {
  try {
    const payload = await auth.getAuthPayload(request)
    if (socket.closed) {
      return logger.error(socket.errored, `Socket closed during upgrade`)
    }
    if (!payload) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      return socket.destroy()
    }
    if (!payload.roles.includes(VNC_READ_ROLE)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
      return socket.destroy()
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, payload)
    })
  } catch (err) {
    if (!socket.closed) {
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n')
      socket.destroy()
    }
    logger.error(err, 'Unexpecter error during upgrade')
  }
})

wss.on('listening', () => {
  logger.info(`WebSocketServer listening ${SERVER_PORT}`)
})

wss.on('error', (err) => {
  logger.error(`WebSocketServer error: ${err.message}`)
})

wss.on('close', () => {
  clearInterval(monitor)
})

// When authenticated client connects via WebSocket
wss.on('connection', async (client: WebSocket & { isAlive: boolean }, request: IncomingMessage, payload: AuthPayload) => {
  client.isAlive = true
  client.on('pong', () => {
    client.isAlive = true
  })
  const pathname = getPathname(request)
  const logger = parentLogger.child({ name: payload.name })
  const readonly = !payload.roles.includes(VNC_INPUT_ROLE)

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
    if (!MACHINE_PATH_RE.test(pathname))
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

  createProxyStream(machine, client, logger, readonly)
})

server.listen(Number.parseInt(SERVER_PORT), SERVER_HOST, () => {
  logger.info(`Server listening %s:%s.`, SERVER_HOST, SERVER_PORT)
})

function createProxyStream(machine: Machine, client: WebSocket, logger: Logger, readonly: boolean) {
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

  let handshakeInProgress = true
  let handshakeSuccess = false

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
      if (handshakeInProgress) {
        // Server finalizes handshakes, so we check if iterator is done
        const result = proxy.next({ type: MessageType.Server, data })
        if (result.done) {
          handshakeInProgress = false
          handshakeSuccess = result.value
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
      if (handshakeInProgress) {
        proxy.next({ type: MessageType.Client, data })
        server.write(data)
      } else if (handshakeSuccess) {
        // Filter out key and pointer events if client is readonly
        if (readonly) {
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
