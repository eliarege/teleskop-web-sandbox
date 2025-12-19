import type { H3Event } from 'h3'
import pino from 'pino'

export interface OperationStreamLogMeta {
  /** Progress value from 0 to 100 */
  progress?: number
  /** Any additional metadata */
  [key: string]: any
}

export interface ParentLogFn {
  (meta: object, message?: string): void
  (message: string): void
}

export interface OperationStreamLogFn {
  (meta: OperationStreamLogMeta, message?: string): void
  (message: string): void
}

export interface ParentLogger {
  info: ParentLogFn
  warn: ParentLogFn
  error: ParentLogFn
  debug: ParentLogFn
}

// Need to make it similar to pino logger
export interface OperationStreamLogger {
  info: OperationStreamLogFn
  warn: OperationStreamLogFn
  error: OperationStreamLogFn
  debug: OperationStreamLogFn
  success: OperationStreamLogFn
  /** Set progress without logging a message */
  progress: (value: number) => void
  complete: (message?: string) => void
  fail: (message: string) => void
}

export interface OperationStream {
  stream: ReadableStream<Uint8Array>
  logger: OperationStreamLogger
  close: () => void
  /** AbortSignal that triggers when client disconnects */
  signal: AbortSignal
  /** Whether the client has disconnected */
  isCancelled: () => boolean
}

export type StreamMessageType = 'log' | 'progress' | 'complete' | 'error'
export type StreamLogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug'

export type StreamLogMessage = {
  type: 'log'
  level: StreamLogLevel
  message?: string
  [key: string]: any
}

export type StreamCompleteMessage = {
  type: 'complete'
  message?: string
}

export type StreamErrorMessage = {
  type: 'error'
  message: string
}

export type StreamProgressMessage = {
  type: 'progress'
  progress: number
}

export type StreamMessage =
  | StreamLogMessage
  | StreamCompleteMessage
  | StreamErrorMessage
  | StreamProgressMessage

const LOG_LEVEL: Record<StreamLogLevel, number> = {
  info: 30,
  warn: 40,
  error: 50,
  success: 30,
  debug: 20,
}

const defaultLogger = pino({ level: 'warn' })
/**
 * Creates a Server-Sent Events stream for long-running operations
 *
 * @example
 * ```ts
 * export default defineEventHandler(async (event) => {
 *   const { stream, logger, signal, isCancelled } = createSSEStream(event)
 *
 *   // Option 1: Use signal with fetch or other AbortSignal-compatible APIs
 *   await fetch(url, { signal })
 *
 *   // Option 2: Check cancellation in loops
 *   for (const item of items) {
 *     if (isCancelled()) {
 *       logger.warn('Operation cancelled by client')
 *       return stream
 *     }
 *     await processItem(item)
 *   }
 *
 *   // Option 3: Listen for abort event
 *   signal.addEventListener('abort', () => {
 *     cleanup()
 *   })
 *
 *   return stream
 * })
 * ```
 */
export function createLongOperationStream(event: H3Event, parentLogger: ParentLogger = defaultLogger, clientLevel: StreamLogLevel = 'info'): OperationStream {
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null
  let isClosed = false

  // Create an AbortController to signal cancellation
  const abortController = new AbortController()

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl
    },
    cancel() {
      isClosed = true
      abortController.abort()
    },
  })

  // Listen for client disconnect
  if (event.node?.req) {
    event.node.req.on('close', () => {
      isClosed = true
      abortController.abort()
    })
  }

  // Set SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  const send = (data: StreamMessage) => {
    if (isClosed || !controller)
      return

    // Only send logs that meet the client log level
    if (data.type === 'log' && LOG_LEVEL[data.level] < LOG_LEVEL[clientLevel])
      return

    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      controller.enqueue(encoder.encode(message))
    } catch (e) {
      // Stream might be closed
      parentLogger.error({ error: e }, 'Failed to send SSE message')
      isClosed = true
    }
  }

  const close = () => {
    if (!isClosed && controller) {
      try {
        controller.close()
      } catch (e) {
        // Already closed
      }
      isClosed = true
    }
  }

  const createLogMethod = (level: StreamLogLevel) => {
    return (metaOrMessage: OperationStreamLogMeta | string, message?: string) => {
      level = level === 'success' ? 'info' : level
      if (typeof metaOrMessage === 'string') {
        parentLogger[level](metaOrMessage)
        send({ type: 'log', level, message: metaOrMessage })
      } else {
        const { progress, ...rest } = metaOrMessage
        parentLogger[level](rest, message)
        send({
          type: 'log',
          level,
          message: message || '',
          progress,
          meta: Object.keys(rest).length > 0 ? rest : undefined,
        })
      }
    }
  }

  const logger: OperationStreamLogger = {
    info: createLogMethod('info'),
    warn: createLogMethod('warn'),
    error: createLogMethod('error'),
    success: createLogMethod('success'),
    debug: createLogMethod('debug'),
    progress: (value: number) => {
      send({ type: 'progress', progress: value })
    },
    complete: (message = 'Operation completed successfully') => {
      send({ type: 'complete', message })
      close()
    },
    fail: (message: string) => {
      send({ type: 'error', message })
      parentLogger.error(message)
      close()
    },
  }

  return {
    stream,
    logger,
    close,
    signal: abortController.signal,
    isCancelled: () => isClosed,
  }
}
