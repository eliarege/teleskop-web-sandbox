import { randomInt } from 'node:crypto'
import type { H3Event } from 'h3'
import pino from 'pino'
import z from 'zod/v4'
import type { StreamLogLevel, StreamMessage, TaskI18n } from '../../shared/taskStream.types'
import { isAbortError } from '../../shared/taskStream.utils'

export interface TaskStreamLogMeta {
  i18n?: TaskI18n
  [key: string]: any
}

export type TaskStreamErrorMeta = TaskStreamLogMeta & { error?: unknown }

export interface ParentLogFn {
  (meta: object, message?: string): void
  (message: string): void
}

export interface TaskStreamLogFn {
  (meta: TaskStreamLogMeta, message?: string): void
  (message: string): void
}

export interface ParentLogger {
  info: ParentLogFn
  warn: ParentLogFn
  error: ParentLogFn
  debug: ParentLogFn
}

// Need to make it similar to pino logger
export interface TaskStreamLogger {
  info: TaskStreamLogFn
  warn: TaskStreamLogFn
  error: TaskStreamLogFn
  debug: TaskStreamLogFn
}

export interface TaskStreamCheckpoint<T = unknown> {
  get: () => Promise<T | null>
  set: (value: T) => Promise<void>
}

export interface TaskStreamState {
  progress: (value: number) => void
  complete: (metaOrMessage?: TaskStreamLogMeta | string, message?: string) => Promise<void>
  fail: (metaOrMessage?: TaskStreamErrorMeta | string, message?: string) => Promise<void>
  isClosed(): boolean
}

export interface TaskStream<T = unknown> {
  readonly taskId: string
  stream: ReadableStream<Uint8Array>
  logger: TaskStreamLogger
  /** AbortSignal that triggers when client disconnects */
  signal: AbortSignal
  state: TaskStreamState
  checkpoint: TaskStreamCheckpoint<T>
  /** Helper function to create i18n translation objects for client-side translation */
  t: (key: string, params?: Record<string, unknown>) => TaskStreamLogMeta
}

export type TaskStreamData<T = unknown> = {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'aborted'
  checkpoint: T | null
  updatedAt: number
  // This can only be in memory
  streamManager?: StreamManager
}

export interface TaskStreamOptions {
  parentLogger?: ParentLogger
  clientLogLevel?: StreamLogLevel
  /** Warn if sending message on closed stream */
  warnOnClosedStreamSend?: boolean
  /** Warn during development if handler returns without calling complete() or fail() */
  warnOnReturnWithoutCompletion?: boolean
}

export type TaskStreamOutput =
  | { kind: 'stream', stream: ReadableStream }
  | { kind: 'completed' }
  | { kind: 'aborted' }

const LOG_LEVEL: Record<StreamLogLevel, number> = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
}

interface TaskRepository {
  get: (id: string) => Promise<TaskStreamData | null>
  set: (id: string, task: TaskStreamData) => Promise<void>
  delete: (id: string) => Promise<void>
  cleanup: () => Promise<void>
}

interface InMemoryTaskRepositoryOptions {
  cleanupInterval?: number
  taskTTLSeconds?: number
  failedTaskTTLSeconds?: number
}

class InMemoryTaskRepository implements TaskRepository {
  private store = new Map<string, TaskStreamData>()
  private cleanupInterval: number
  private taskTTLSeconds: number
  private failedTaskTTLSeconds: number

  constructor(
    options?: InMemoryTaskRepositoryOptions,
  ) {
    this.cleanupInterval = options?.cleanupInterval ?? 60 * 1000
    this.taskTTLSeconds = options?.taskTTLSeconds ?? 3600
    this.failedTaskTTLSeconds = options?.failedTaskTTLSeconds ?? 300
    setInterval(() => this.cleanup(), this.cleanupInterval).unref()
  }

  async get<T>(id: string): Promise<TaskStreamData<T> | null> {
    const task = this.store.get(id) as TaskStreamData<T> | undefined
    if (task && this.isExpired(task)) {
      this.store.delete(id)
      return null
    }
    return task || null
  }

  async set(id: string, task: TaskStreamData): Promise<void> {
    task.updatedAt = Date.now()
    this.store.set(id, task)
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id)
  }

  async cleanup(): Promise<void> {
    for (const [id, task] of this.store.entries()) {
      if (this.isExpired(task)) {
        this.store.delete(id)
      }
    }
  }

  private isExpired(task: TaskStreamData): boolean {
    if (task.status === 'completed' || task.status === 'aborted') {
      return true
    } else if (task.status === 'failed') {
      const now = Date.now()
      if (now - task.updatedAt > this.failedTaskTTLSeconds * 1000) {
        return true
      }
    } else {
      const now = Date.now()
      if (now - task.updatedAt > this.taskTTLSeconds * 1000) {
        return true
      }
    }
    return false
  }
}

const taskStore = new InMemoryTaskRepository()
const defaultLogger = pino({ level: 'warn' })

const querySchema = z.object({
  taskId: z.string().optional(),
  action: z.enum(['retry', 'abort']).optional(),
})

/**
 * Task Manager - Handles all task persistence and lifecycle management
 */
class TaskManager<T = unknown> {
  constructor(private store: TaskRepository) {}

  async getOrCreate(taskId?: string): Promise<TaskStreamData<T>> {
    const task = taskId ? (await this.store.get(taskId) as TaskStreamData<T> | null) : null
    if (task) {
      return task
    } else {
      const newTask: TaskStreamData<T> = {
        id: taskId || randomId(),
        status: 'pending',
        checkpoint: null,
        updatedAt: Date.now(),
      }
      await this.store.set(newTask.id, newTask)
      return newTask
    }
  }

  async setRunning(taskId: string): Promise<void> {
    const task = await this.store.get(taskId)
    if (task) {
      task.status = 'running'
      await this.store.set(taskId, task)
    }
  }

  async setCompleted(taskId: string): Promise<void> {
    const task = await this.store.get(taskId)
    if (task) {
      task.status = 'completed'
      await this.store.set(taskId, task)
    }
  }

  async setFailed(taskId: string): Promise<void> {
    const task = await this.store.get(taskId)
    if (task) {
      task.status = 'failed'
      await this.store.set(taskId, task)
    }
  }

  async abortTask(taskId: string): Promise<void> {
    const task = await this.store.get(taskId)
    if (task && task.streamManager) {
      task.streamManager.cancel()
      task.status = 'aborted'
      await this.store.set(taskId, task)
    }
  }

  async setStreamManager(taskId: string, streamManager: StreamManager): Promise<void> {
    const task = await this.store.get(taskId)
    if (task) {
      task.streamManager = streamManager
      await this.store.set(taskId, task)
    }
  }

  async getCheckpoint(taskId: string): Promise<T | null> {
    const task = await this.store.get(taskId) as TaskStreamData<T> | null
    return (task?.checkpoint as T) ?? null
  }

  async setCheckpoint(taskId: string, data: T): Promise<void> {
    const task = await this.store.get(taskId)
    if (task) {
      task.checkpoint = data
      await this.store.set(taskId, task)
    }
  }
}

interface StreamManagerOptions {
  parentLogger: ParentLogger
  clientLogLevel: StreamLogLevel
  warnOnClosedStreamSend: boolean
}
/**
 * Stream Manager - Handles SSE stream creation and message sending
 */
class StreamManager {
  private encoder = new TextEncoder()
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null
  private isClosed = false
  private isCancelled = false
  private abortController = new AbortController()
  private clientLogLevel: StreamLogLevel
  private parentLogger: ParentLogger
  public readonly stream: ReadableStream<Uint8Array>

  constructor(
    event: H3Event,
    private options: StreamManagerOptions,
  ) {
    this.parentLogger = options.parentLogger
    this.clientLogLevel = options.clientLogLevel
    this.stream = new ReadableStream<Uint8Array>({
      start: (ctrl) => {
        this.controller = ctrl
      },
      cancel: () => {
        this.cancel()
      },
    })

    // Listen for client disconnect
    if (event.node?.req) {
      event.node.req.on('close', () => {
        this.cancel()
      })
    }

    // Set SSE headers
    setResponseHeaders(event, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })
  }

  get signal(): AbortSignal {
    return this.abortController.signal
  }

  send(data: StreamMessage): void {
    if (this.isClosed || !this.controller) {
      if (
        import.meta.dev
          && this.options.warnOnClosedStreamSend
          && data.type === 'log' && LOG_LEVEL[data.level] < LOG_LEVEL[this.clientLogLevel]
      ) {
        this.parentLogger.warn('Attempted to send message on closed stream')
      }
      return
    }

    // Only send logs that meet the client log level
    if (data.type === 'log' && LOG_LEVEL[data.level] < LOG_LEVEL[this.clientLogLevel])
      return

    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      this.controller.enqueue(this.encoder.encode(message))
    } catch (e) {
      this.parentLogger.error({ error: e }, 'Failed to send SSE message')
      this.cancel()
    }
  }

  /** Close the stream normally (e.g., after complete/fail) */
  close(): void {
    if (!this.isClosed) {
      try {
        this.controller?.close()
      } catch (e) {
        // Already closed
      }
      this.isClosed = true
    }
  }

  /** Cancel the stream (client disconnect or abort) - DOES aborts signal */
  cancel() {
    if (this.isClosed)
      return
    this.isCancelled = true
    this.abortController.abort()
    this.close()
  }

  createLogger(): TaskStreamLogger {
    const createLogMethod = (level: StreamLogLevel) => {
      return (metaOrMessage: TaskStreamLogMeta | string, message?: string) => {
        if (typeof metaOrMessage === 'string') {
          this.parentLogger[level](metaOrMessage)
          this.send({ type: 'log', level, message: metaOrMessage })
        } else {
          const meta = metaOrMessage
          this.parentLogger[level](meta, message)
          this.send({
            type: 'log',
            level,
            message: message || '',
            meta: Object.keys(meta).length > 0 ? meta : undefined,
          })
        }
      }
    }

    return {
      info: createLogMethod('info'),
      warn: createLogMethod('warn'),
      error: createLogMethod('error'),
      debug: createLogMethod('debug'),
    }
  }

  isStreamClosed(): boolean {
    return this.isClosed
  }

  isStreamCancelled(): boolean {
    return this.isCancelled
  }
}

/**
 * Create task stream with given handler. Task state is fetched via `taskId` query parameter.
 *
 * @returns TaskStreamOutput based on task state
 *
 * - If task is already running, throws 409 error
 * - If task was completed, returns `{ kind: 'completed' }`
 * - If task was aborted, returns `{ kind: 'aborted' }`
 *
 * Otherwise, returns `{ kind: 'stream', stream: ReadableStream }`
 */
export async function createTaskStream<T>(
  event: H3Event,
  handler: (ctx: Omit<TaskStream<T>, 'stream'>) => Promise<void>,
  options?: TaskStreamOptions,
): Promise<TaskStreamOutput> {
  // Parse and validate query parameters
  const query = querySchema.safeParse(getQuery(event))
  if (!query.success) {
    throw createError({
      status: 400,
      message: 'Invalid task query parameters',
    })
  }
  const { taskId, action } = query.data

  // Initialize managers
  const taskManager = new TaskManager<T>(taskStore)
  const task = await taskManager.getOrCreate(taskId)

  // Handle task state checks
  if (task.status === 'running' && action !== 'abort') {
    throw createError({
      status: 409,
      message: 'Task is already running',
    })
  }
  if (task.status === 'completed') {
    return { kind: 'completed' }
  }
  if (task.status === 'aborted') {
    return { kind: 'aborted' }
  }

  // Handle abort action on failed task
  if (action === 'abort') {
    await taskManager.abortTask(task.id)
    return { kind: 'aborted' }
  }

  // Create stream manager
  const {
    parentLogger = defaultLogger,
    clientLogLevel = 'info',
    warnOnClosedStreamSend = true,
    warnOnReturnWithoutCompletion = true,
  } = options || {}
  const streamManager = new StreamManager(event, {
    parentLogger,
    clientLogLevel,
    warnOnClosedStreamSend,
  })
  await taskManager.setStreamManager(task.id, streamManager)

  let isFinalized = false
  // Create context for consumer
  const ctx: Omit<TaskStream<T>, 'stream'> = {
    taskId: task.id,
    logger: streamManager.createLogger(),
    signal: streamManager.signal,
    t: (key: string, params?: Record<string, unknown>): TaskStreamLogMeta => ({ i18n: { key, params } }),
    state: {
      progress: (value) => {
        streamManager.send({ type: 'progress', progress: value })
      },
      complete: async (metaOrMessage?: TaskStreamLogMeta | string, message?: string) => {
        if (isFinalized)
          return
        isFinalized = true
        await taskManager.setCompleted(task.id)

        if (metaOrMessage && typeof metaOrMessage === 'object') {
          streamManager.send({ type: 'complete', meta: metaOrMessage, message })
        } else {
          streamManager.send({ type: 'complete', message: metaOrMessage })
        }
        streamManager.close()
      },
      fail: async (metaOrMessage?: TaskStreamErrorMeta | string, message?: string) => {
        if (isFinalized)
          return
        isFinalized = true
        await taskManager.setFailed(task.id)
        if (metaOrMessage && typeof metaOrMessage === 'object') {
          const { error, ...meta } = metaOrMessage
          const errorMessage = error instanceof Error
            ? error.message
            : error ? String(error) : undefined
          streamManager.send({ type: 'fail', meta, message, error: errorMessage })
        } else {
          streamManager.send({ type: 'fail', message: metaOrMessage })
        }
        streamManager.close()
      },
      isClosed: () => streamManager.isStreamClosed(),
    },
    checkpoint: {
      get: () => taskManager.getCheckpoint(task.id),
      set: (value: T) => taskManager.setCheckpoint(task.id, value),
    },
  }

  // Set task to running
  await taskManager.setRunning(task.id)
  streamManager.send({ type: 'meta', id: task.id })

  // Execute handler asynchronously
  ;(async () => {
    try {
      await handler(ctx)
    } catch (error) {
      if (isAbortError(error))
        return
      await ctx.state.fail({ error })
    } finally {
      if (import.meta.dev) {
        if (!isFinalized && warnOnReturnWithoutCompletion) {
          parentLogger.warn(
            { taskId: task.id },
            'Handler exited without calling complete() or fail()',
          )
        }
      }
    }
  })()

  return { kind: 'stream', stream: streamManager.stream }
}

function randomId(): string {
  return randomInt(1e6, 1e7 - 1).toString()
}
